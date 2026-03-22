import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const IMPORT_SELLER_EMAIL = 'marketplace@globalmarkethub.com';

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const runImportScript = () =>
  new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
    const child = spawn(process.execPath, ['scripts/importRealProductsByCategory.js'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        REAL_IMPORT_PER_CATEGORY: String(toPositiveInt(process.env.NIGHT_SYNC_PER_CATEGORY, 8)),
        REAL_IMPORT_DARAZ_PAGES: String(toPositiveInt(process.env.NIGHT_SYNC_DARAZ_PAGES, 1)),
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        code: code ?? 1,
      });
    });
  });

const deactivateStaleProducts = async () => {
  const staleHours = toPositiveInt(process.env.NIGHT_SYNC_STALE_HOURS, 30);
  const staleBefore = new Date(Date.now() - staleHours * 60 * 60 * 1000);

  const result = await prisma.product.updateMany({
    where: {
      isActive: true,
      certifications: { has: 'live-imported' },
      seller: {
        email: IMPORT_SELLER_EMAIL,
      },
      updatedAt: { lt: staleBefore },
    },
    data: {
      isActive: false,
    },
  });

  return {
    staleHours,
    staleBefore,
    deactivatedCount: result.count,
  };
};

const isAuthorized = (request: NextRequest) => {
  const cronHeader = request.headers.get('x-vercel-cron');
  if (cronHeader) return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const importResult = await runImportScript();

  if (importResult.code !== 0) {
    return NextResponse.json(
      {
        ok: false,
        phase: 'import',
        code: importResult.code,
        stderr: importResult.stderr.slice(-4000),
        stdout: importResult.stdout.slice(-4000),
      },
      { status: 500 },
    );
  }

  const staleSummary = await deactivateStaleProducts();

  return NextResponse.json({
    ok: true,
    code: importResult.code,
    staleSummary,
    stdout: importResult.stdout.slice(-4000),
  });
}
