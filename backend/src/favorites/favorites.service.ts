import { Injectable, NotFoundException } from '@nestjs/common';
import type { FavoriteKind } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface ResolvedFavorite {
  id: string;
  kind: FavoriteKind;
  entityId: string;
  label: string;
  icon: string | null;
}

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Favorites enriched with their target's label + icon; stale ones dropped. */
  async list(userId: string): Promise<ResolvedFavorite[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    if (favorites.length === 0) return [];

    const listIds = favorites.filter((f) => f.kind === 'LIST').map((f) => f.entityId);
    const noteIds = favorites.filter((f) => f.kind === 'NOTE').map((f) => f.entityId);

    const [lists, notes] = await Promise.all([
      listIds.length
        ? this.prisma.list.findMany({
            where: { id: { in: listIds }, userId },
            select: { id: true, name: true, icon: true },
          })
        : Promise.resolve([]),
      noteIds.length
        ? this.prisma.note.findMany({
            where: { id: { in: noteIds }, userId },
            select: { id: true, title: true, icon: true },
          })
        : Promise.resolve([]),
    ]);

    const listMap = new Map(lists.map((l) => [l.id, l]));
    const noteMap = new Map(notes.map((n) => [n.id, n]));

    const resolved: ResolvedFavorite[] = [];
    for (const f of favorites) {
      if (f.kind === 'LIST') {
        const l = listMap.get(f.entityId);
        if (l) resolved.push({ id: f.id, kind: f.kind, entityId: f.entityId, label: l.name, icon: l.icon });
      } else {
        const n = noteMap.get(f.entityId);
        if (n) {
          resolved.push({
            id: f.id,
            kind: f.kind,
            entityId: f.entityId,
            label: n.title || 'Untitled',
            icon: n.icon,
          });
        }
      }
    }
    return resolved;
  }

  async add(userId: string, kind: FavoriteKind, entityId: string): Promise<ResolvedFavorite> {
    await this.assertOwned(userId, kind, entityId);
    const count = await this.prisma.favorite.count({ where: { userId } });
    await this.prisma.favorite.upsert({
      where: { userId_kind_entityId: { userId, kind, entityId } },
      create: { userId, kind, entityId, position: count },
      update: {},
    });
    const list = await this.list(userId);
    const found = list.find((f) => f.kind === kind && f.entityId === entityId);
    if (!found) throw new NotFoundException('Favorite target not found');
    return found;
  }

  async remove(
    userId: string,
    kind: FavoriteKind,
    entityId: string,
  ): Promise<{ removed: boolean }> {
    const res = await this.prisma.favorite.deleteMany({ where: { userId, kind, entityId } });
    return { removed: res.count > 0 };
  }

  private async assertOwned(
    userId: string,
    kind: FavoriteKind,
    entityId: string,
  ): Promise<void> {
    const exists =
      kind === 'LIST'
        ? await this.prisma.list.findFirst({ where: { id: entityId, userId }, select: { id: true } })
        : await this.prisma.note.findFirst({ where: { id: entityId, userId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Favorite target not found');
  }
}
