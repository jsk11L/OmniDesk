/**
 * Lossy converters between TipTap JSON (the note source of truth) and Markdown.
 * Used by the exporter (D-022) and the Obsidian/own-export importers.
 */
import { marked, type Token, type Tokens } from 'marked';

interface TipTapNode {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

// ─── TipTap JSON → Markdown ──────────────────────────────────

export function tiptapToMarkdown(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return '';
  let doc: TipTapNode;
  try {
    doc = JSON.parse(raw) as TipTapNode;
  } catch {
    // Not JSON — assume it's already plain text/markdown.
    return raw;
  }
  if (!doc || typeof doc !== 'object' || !doc.content) return '';
  return doc.content
    .map((n) => blockToMd(n))
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function blockToMd(node: TipTapNode, depth = 0): string {
  switch (node.type) {
    case 'paragraph':
      return inlineToMd(node.content);
    case 'heading': {
      const level = Number(node.attrs?.['level'] ?? 1);
      return `${'#'.repeat(Math.min(Math.max(level, 1), 6))} ${inlineToMd(node.content)}`;
    }
    case 'bulletList':
      return (node.content ?? [])
        .map((li) => listItemToMd(li, depth, '-'))
        .join('\n');
    case 'orderedList':
      return (node.content ?? [])
        .map((li, i) => listItemToMd(li, depth, `${i + 1}.`))
        .join('\n');
    case 'blockquote':
      return (node.content ?? [])
        .map((b) => blockToMd(b, depth))
        .join('\n\n')
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n');
    case 'codeBlock': {
      const lang = String(node.attrs?.['language'] ?? '');
      const code = (node.content ?? []).map((c) => c.text ?? '').join('');
      return '```' + lang + '\n' + code + '\n```';
    }
    case 'horizontalRule':
      return '---';
    case 'image': {
      const src = String(node.attrs?.['src'] ?? '');
      const alt = String(node.attrs?.['alt'] ?? '');
      return `![${alt}](${src})`;
    }
    default:
      return inlineToMd(node.content);
  }
}

function listItemToMd(li: TipTapNode, depth: number, marker: string): string {
  const indent = '  '.repeat(depth);
  const inner = (li.content ?? [])
    .map((b, i) => {
      if (b.type === 'bulletList' || b.type === 'orderedList') return blockToMd(b, depth + 1);
      const md = blockToMd(b, depth);
      return i === 0 ? md : `${indent}  ${md}`;
    })
    .join('\n');
  return `${indent}${marker} ${inner}`;
}

function inlineToMd(content: TipTapNode[] | undefined): string {
  if (!content) return '';
  return content
    .map((n) => {
      if (n.type === 'hardBreak') return '  \n';
      if (n.type === 'image') {
        return `![${String(n.attrs?.['alt'] ?? '')}](${String(n.attrs?.['src'] ?? '')})`;
      }
      let text = n.text ?? '';
      if (!text) return '';
      const marks = n.marks ?? [];
      let href: string | null = null;
      for (const m of marks) {
        switch (m.type) {
          case 'code':
            text = '`' + text + '`';
            break;
          case 'bold':
            text = `**${text}**`;
            break;
          case 'italic':
            text = `*${text}*`;
            break;
          case 'strike':
            text = `~~${text}~~`;
            break;
          case 'link':
            href = String(m.attrs?.['href'] ?? '');
            break;
        }
      }
      return href ? `[${text}](${href})` : text;
    })
    .join('');
}

// ─── Markdown → TipTap JSON ──────────────────────────────────

export function markdownToTiptap(md: string): TipTapNode {
  const tokens = marked.lexer(md ?? '');
  const content = tokens.flatMap(blockFromToken).filter(Boolean) as TipTapNode[];
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

function blockFromToken(token: Token): TipTapNode[] {
  switch (token.type) {
    case 'heading':
      return [{ type: 'heading', attrs: { level: token.depth }, content: inlineFromTokens(token.tokens) }];
    case 'paragraph': {
      const para = token as Tokens.Paragraph;
      // A paragraph that is solely an image → image node.
      if (para.tokens?.length === 1 && para.tokens[0].type === 'image') {
        const img = para.tokens[0] as Tokens.Image;
        return [{ type: 'image', attrs: { src: img.href, alt: img.text ?? '' } }];
      }
      return [{ type: 'paragraph', content: inlineFromTokens(para.tokens) }];
    }
    case 'list': {
      const list = token as Tokens.List;
      const items: TipTapNode[] = list.items.map((it) => ({
        type: 'listItem',
        content: marked.lexer(it.text).flatMap(blockFromToken),
      }));
      return [{ type: list.ordered ? 'orderedList' : 'bulletList', content: items }];
    }
    case 'code':
      return [
        {
          type: 'codeBlock',
          attrs: { language: (token as Tokens.Code).lang ?? null },
          content: [{ type: 'text', text: (token as Tokens.Code).text }],
        },
      ];
    case 'blockquote':
      return [{ type: 'blockquote', content: marked.lexer((token as Tokens.Blockquote).text).flatMap(blockFromToken) }];
    case 'hr':
      return [{ type: 'horizontalRule' }];
    case 'space':
      return [];
    default: {
      const text = (token as { text?: string }).text;
      return text ? [{ type: 'paragraph', content: [{ type: 'text', text }] }] : [];
    }
  }
}

function inlineFromTokens(tokens: Token[] | undefined): TipTapNode[] {
  if (!tokens) return [];
  const out: TipTapNode[] = [];
  for (const t of tokens) out.push(...inlineOne(t, []));
  return out;
}

function inlineOne(token: Token, marks: { type: string; attrs?: Record<string, unknown> }[]): TipTapNode[] {
  switch (token.type) {
    case 'text': {
      const tt = token as Tokens.Text;
      if (tt.tokens?.length) return tt.tokens.flatMap((c) => inlineOne(c, marks));
      return [{ type: 'text', text: tt.text, ...(marks.length ? { marks } : {}) }];
    }
    case 'strong':
      return (token as Tokens.Strong).tokens.flatMap((c) => inlineOne(c, [...marks, { type: 'bold' }]));
    case 'em':
      return (token as Tokens.Em).tokens.flatMap((c) => inlineOne(c, [...marks, { type: 'italic' }]));
    case 'del':
      return (token as Tokens.Del).tokens.flatMap((c) => inlineOne(c, [...marks, { type: 'strike' }]));
    case 'codespan':
      return [{ type: 'text', text: (token as Tokens.Codespan).text, marks: [...marks, { type: 'code' }] }];
    case 'link': {
      const link = token as Tokens.Link;
      return link.tokens.flatMap((c) => inlineOne(c, [...marks, { type: 'link', attrs: { href: link.href } }]));
    }
    case 'image': {
      const img = token as Tokens.Image;
      return [{ type: 'image', attrs: { src: img.href, alt: img.text ?? '' } }];
    }
    case 'br':
      return [{ type: 'hardBreak' }];
    case 'escape':
      return [{ type: 'text', text: (token as Tokens.Escape).text, ...(marks.length ? { marks } : {}) }];
    default: {
      const text = (token as { text?: string }).text;
      return text ? [{ type: 'text', text, ...(marks.length ? { marks } : {}) }] : [];
    }
  }
}
