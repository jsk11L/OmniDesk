import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SYSTEM_USER_ID = process.env.SEED_SYSTEM_USER_ID ?? '00000000-0000-0000-0000-000000000001';

interface SystemTheme {
  id: string;
  name: string;
  isDark: boolean;
  colorPrimary: string;
  colorSecondary: string;
  colorBackground: string;
  colorSurface: string;
  colorSurfaceHover: string;
  colorBorder: string;
  colorText: string;
  colorTextMuted: string;
  colorAccent: string;
  colorDanger: string;
  colorSuccess: string;
}

const SYSTEM_THEMES: SystemTheme[] = [
  {
    id: '11111111-1111-1111-1111-000000000001',
    name: 'Obsidian Dark',
    isDark: true,
    colorPrimary: '#6366f1',
    colorSecondary: '#8b5cf6',
    colorBackground: '#0f0f0f',
    colorSurface: '#1a1a1a',
    colorSurfaceHover: '#242424',
    colorBorder: '#2e2e2e',
    colorText: '#e5e5e5',
    colorTextMuted: '#71717a',
    colorAccent: '#f59e0b',
    colorDanger: '#ef4444',
    colorSuccess: '#22c55e',
  },
  {
    id: '11111111-1111-1111-1111-000000000002',
    name: 'Notion Light',
    isDark: false,
    colorPrimary: '#2d2d2d',
    colorSecondary: '#5b5b5b',
    colorBackground: '#ffffff',
    colorSurface: '#f7f7f5',
    colorSurfaceHover: '#ececec',
    colorBorder: '#e5e7eb',
    colorText: '#1f2328',
    colorTextMuted: '#6b7280',
    colorAccent: '#ea580c',
    colorDanger: '#dc2626',
    colorSuccess: '#16a34a',
  },
  {
    id: '11111111-1111-1111-1111-000000000003',
    name: 'Midnight Blue',
    isDark: true,
    colorPrimary: '#3b82f6',
    colorSecondary: '#60a5fa',
    colorBackground: '#0d1117',
    colorSurface: '#161b22',
    colorSurfaceHover: '#21262d',
    colorBorder: '#30363d',
    colorText: '#e6edf3',
    colorTextMuted: '#7d8590',
    colorAccent: '#06b6d4',
    colorDanger: '#f85149',
    colorSuccess: '#3fb950',
  },
  {
    id: '11111111-1111-1111-1111-000000000004',
    name: 'Forest',
    isDark: true,
    colorPrimary: '#22c55e',
    colorSecondary: '#16a34a',
    colorBackground: '#0f1a0f',
    colorSurface: '#1a2e1a',
    colorSurfaceHover: '#234a23',
    colorBorder: '#2e4a2e',
    colorText: '#e8f5e9',
    colorTextMuted: '#86a886',
    colorAccent: '#84cc16',
    colorDanger: '#ef4444',
    colorSuccess: '#10b981',
  },
  {
    id: '11111111-1111-1111-1111-000000000005',
    name: 'Sunset',
    isDark: true,
    colorPrimary: '#f59e0b',
    colorSecondary: '#fb923c',
    colorBackground: '#1a0f00',
    colorSurface: '#2e1a00',
    colorSurfaceHover: '#4a2e0a',
    colorBorder: '#4a3a2e',
    colorText: '#fef3c7',
    colorTextMuted: '#a89373',
    colorAccent: '#ec4899',
    colorDanger: '#dc2626',
    colorSuccess: '#84cc16',
  },
  // ── Warm collection ─────────────────────────────────────────
  {
    id: '11111111-1111-1111-1111-000000000006',
    name: 'Vampire Blood',
    isDark: true,
    colorPrimary: '#8a0303',
    colorSecondary: '#a30404',
    colorBackground: '#0a0000',
    colorSurface: '#1a0505',
    colorSurfaceHover: '#2b0a0a',
    colorBorder: '#3d1313',
    colorText: '#f5e5e5',
    colorTextMuted: '#a08585',
    colorAccent: '#ff4444',
    colorDanger: '#ff1744',
    colorSuccess: '#5cb85c',
  },
  {
    id: '11111111-1111-1111-1111-000000000007',
    name: 'Ember Glow',
    isDark: true,
    colorPrimary: '#e25822',
    colorSecondary: '#ff6b35',
    colorBackground: '#1a0d05',
    colorSurface: '#2b1a0d',
    colorSurfaceHover: '#3d2515',
    colorBorder: '#4d3320',
    colorText: '#fff4e6',
    colorTextMuted: '#b39477',
    colorAccent: '#ffb84d',
    colorDanger: '#cc2929',
    colorSuccess: '#7cb342',
  },
  {
    id: '11111111-1111-1111-1111-000000000008',
    name: 'Crimson Wine',
    isDark: true,
    colorPrimary: '#722f37',
    colorSecondary: '#963a47',
    colorBackground: '#14080a',
    colorSurface: '#1f1014',
    colorSurfaceHover: '#2e1820',
    colorBorder: '#3d2329',
    colorText: '#f0e2e5',
    colorTextMuted: '#a08087',
    colorAccent: '#c2185b',
    colorDanger: '#d32f2f',
    colorSuccess: '#689f38',
  },
  {
    id: '11111111-1111-1111-1111-000000000009',
    name: 'Terracotta',
    isDark: true,
    colorPrimary: '#b85042',
    colorSecondary: '#d4715f',
    colorBackground: '#1f1310',
    colorSurface: '#2e1f1a',
    colorSurfaceHover: '#4a2f25',
    colorBorder: '#5e3d2e',
    colorText: '#f5e6d8',
    colorTextMuted: '#b59885',
    colorAccent: '#e8a87c',
    colorDanger: '#c0392b',
    colorSuccess: '#859e5f',
  },
  {
    id: '11111111-1111-1111-1111-00000000000a',
    name: 'Magma',
    isDark: true,
    colorPrimary: '#ff1744',
    colorSecondary: '#ff5252',
    colorBackground: '#0a0000',
    colorSurface: '#1f0507',
    colorSurfaceHover: '#3d0a0d',
    colorBorder: '#4d1518',
    colorText: '#fff0f0',
    colorTextMuted: '#c49595',
    colorAccent: '#ff9100',
    colorDanger: '#d50000',
    colorSuccess: '#00c853',
  },
  {
    id: '11111111-1111-1111-1111-00000000000b',
    name: 'Rosewood',
    isDark: true,
    colorPrimary: '#a0445e',
    colorSecondary: '#c45f7e',
    colorBackground: '#1a0f12',
    colorSurface: '#2b1820',
    colorSurfaceHover: '#3d2330',
    colorBorder: '#4d2e3d',
    colorText: '#f5dde5',
    colorTextMuted: '#ad8896',
    colorAccent: '#e91e63',
    colorDanger: '#b71c1c',
    colorSuccess: '#66bb6a',
  },
  {
    id: '11111111-1111-1111-1111-00000000000c',
    name: 'Solar Flare',
    isDark: true,
    colorPrimary: '#ff6b00',
    colorSecondary: '#ffa500',
    colorBackground: '#160a00',
    colorSurface: '#241200',
    colorSurfaceHover: '#3d1f00',
    colorBorder: '#5c2d05',
    colorText: '#fff5e0',
    colorTextMuted: '#c4a070',
    colorAccent: '#ffd700',
    colorDanger: '#ff1744',
    colorSuccess: '#76ff03',
  },
];

async function seedSystemUser(): Promise<void> {
  const unreachableHash = await bcrypt.hash(
    `!SYSTEM_USER_NEVER_LOGS_IN_${Date.now()}_${Math.random()}`,
    12,
  );

  await prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    create: {
      id: SYSTEM_USER_ID,
      email: 'system@omnidesk.local',
      passwordHash: unreachableHash,
      displayName: 'OmniDesk System',
      isEmailVerified: false,
    },
    update: {},
  });

  console.log(`✓ System user ready: ${SYSTEM_USER_ID}`);
}

async function seedSystemThemes(): Promise<void> {
  for (const theme of SYSTEM_THEMES) {
    await prisma.theme.upsert({
      where: { id: theme.id },
      create: {
        ...theme,
        userId: SYSTEM_USER_ID,
        isDefault: true,
      },
      update: {
        name: theme.name,
        isDark: theme.isDark,
        colorPrimary: theme.colorPrimary,
        colorSecondary: theme.colorSecondary,
        colorBackground: theme.colorBackground,
        colorSurface: theme.colorSurface,
        colorSurfaceHover: theme.colorSurfaceHover,
        colorBorder: theme.colorBorder,
        colorText: theme.colorText,
        colorTextMuted: theme.colorTextMuted,
        colorAccent: theme.colorAccent,
        colorDanger: theme.colorDanger,
        colorSuccess: theme.colorSuccess,
        isDefault: true,
      },
    });
    console.log(`✓ Theme upserted: ${theme.name}`);
  }
}

async function main(): Promise<void> {
  console.log('--- OmniDesk seed start ---');
  await seedSystemUser();
  await seedSystemThemes();
  console.log('--- OmniDesk seed done ---');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
