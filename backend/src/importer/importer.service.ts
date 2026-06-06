import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import AdmZip from 'adm-zip';
import { basename, dirname, extname } from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { markdownToTiptap } from '../common/tiptap-markdown';

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB (D-024)
const IGNORE = /(^|\/)\.(obsidian|git|trash)(\/|$)/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i;
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export interface ImportReport {
  notesCreated: number;
  assetsUploaded: number;
  wikilinksResolved: number;
  wikilinksUnresolved: number;
  duplicateTitlesRenamed: number;
  skipped: string[];
  errors: string[];
}

@Injectable()
export class ImporterService {
  private readonly logger = new Logger(ImporterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async importObsidian(userId: string, buffer: Buffer): Promise<ImportReport> {
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException('Vault exceeds the 200 MB limit. Split it and import in parts.');
    }
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      throw new BadRequestException('Could not read the zip file');
    }

    const report: ImportReport = {
      notesCreated: 0,
      assetsUploaded: 0,
      wikilinksResolved: 0,
      wikilinksUnresolved: 0,
      duplicateTitlesRenamed: 0,
      skipped: [],
      errors: [],
    };

    const entries = zip.getEntries().filter((e) => !e.isDirectory && !IGNORE.test(e.entryName));

    // 1) Assets → uploaded images, mapped by basename.
    const assetUrls = new Map<string, string>();
    for (const e of entries) {
      const name = e.entryName;
      if (name.toLowerCase().endsWith('.md')) continue;
      if (!IMAGE_EXT.test(name)) {
        report.skipped.push(name);
        continue;
      }
      try {
        const data = e.getData();
        const file = {
          buffer: data,
          mimetype: MIME[extname(name).toLowerCase()] ?? 'image/png',
          originalname: basename(name),
          size: data.length,
        } as Express.Multer.File;
        const { url } = await this.uploads.process(file, userId);
        assetUrls.set(basename(name).toLowerCase(), url);
        report.assetsUploaded++;
      } catch (err) {
        report.skipped.push(name);
        this.logger.warn(`Asset skipped (${name}): ${(err as Error).message}`);
      }
    }

    // 2) Pre-walk notes: assign deduped titles + create placeholders so
    //    wikilinks can resolve to real ids.
    const mdEntries = entries.filter((e) => e.entryName.toLowerCase().endsWith('.md'));
    const titleToId = new Map<string, string>();
    const created: { id: string; body: string }[] = [];
    const usedTitles = new Set<string>();

    for (const e of mdEntries) {
      try {
        const text = e.getData().toString('utf8');
        const { frontmatter, body } = parseFrontmatter(text);
        const originalTitle = (frontmatter.title || basename(e.entryName, '.md')).trim() || 'Untitled';

        let title = originalTitle;
        let n = 2;
        while (usedTitles.has(title.toLowerCase())) {
          title = `${originalTitle} (${n++})`;
          report.duplicateTitlesRenamed++;
        }
        usedTitles.add(title.toLowerCase());

        const dir = dirname(e.entryName);
        const folderTags = dir && dir !== '.' ? dir.split('/').filter(Boolean) : [];
        const tags = [...new Set([...frontmatter.tags, ...folderTags])];

        const note = await this.prisma.note.create({
          data: {
            userId,
            title,
            content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
            tags,
            plainText: '',
          },
        });
        titleToId.set(title.toLowerCase(), note.id);
        titleToId.set(originalTitle.toLowerCase(), note.id);
        created.push({ id: note.id, body });
        report.notesCreated++;
      } catch (err) {
        report.errors.push(`${e.entryName}: ${(err as Error).message}`);
      }
    }

    // 3) Resolve links/embeds and convert Markdown → TipTap.
    for (const c of created) {
      try {
        const pre = this.preprocess(c.body, assetUrls, titleToId, report);
        const doc = markdownToTiptap(pre);
        await this.prisma.note.update({
          where: { id: c.id },
          data: { content: JSON.stringify(doc), plainText: stripMd(pre).slice(0, 10_000) },
        });
      } catch (err) {
        report.errors.push(`note ${c.id}: ${(err as Error).message}`);
      }
    }

    return report;
  }

  private preprocess(
    md: string,
    assets: Map<string, string>,
    titles: Map<string, string>,
    report: ImportReport,
  ): string {
    // Embeds first: ![[asset]] → image, ![[Note]] → link.
    let out = md.replace(/!\[\[([^\]]+)\]\]/g, (_m, inner: string) => {
      const name = inner.split('|')[0].trim();
      const assetUrl = assets.get(basename(name).toLowerCase());
      if (assetUrl) return `![${name}](${assetUrl})`;
      const id = titles.get(name.toLowerCase());
      if (id) {
        report.wikilinksResolved++;
        return `[${name}](/app/notes?note=${id})`;
      }
      report.wikilinksUnresolved++;
      return name;
    });

    // Wikilinks: [[Target|alias]] → link or plain text.
    out = out.replace(/\[\[([^\]]+)\]\]/g, (_m, inner: string) => {
      const [target, alias] = inner.split('|').map((s) => s.trim());
      const id = titles.get(target.toLowerCase());
      if (id) {
        report.wikilinksResolved++;
        return `[${alias || target}](/app/notes?note=${id})`;
      }
      report.wikilinksUnresolved++;
      return `[[${inner}]]`;
    });

    return out;
  }
}

interface Frontmatter {
  title?: string;
  tags: string[];
}

function parseFrontmatter(text: string): { frontmatter: Frontmatter; body: string } {
  const fm: Frontmatter = { tags: [] };
  if (!text.startsWith('---')) return { frontmatter: fm, body: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { frontmatter: fm, body: text };
  const block = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\s*\n/, '');

  const lines = block.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^(\w+):\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'title') {
      fm.title = value.replace(/^["']|["']$/g, '');
    } else if (key === 'tags') {
      if (value.startsWith('[')) {
        fm.tags = value
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map((t) => t.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else if (value) {
        fm.tags = value.split(/[\s,]+/).filter(Boolean);
      } else {
        // YAML list on following lines.
        for (let j = i + 1; j < lines.length && /^\s*-\s+/.test(lines[j]); j++) {
          fm.tags.push(lines[j].replace(/^\s*-\s+/, '').trim());
        }
      }
    }
  }
  return { frontmatter: fm, body };
}

function stripMd(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
