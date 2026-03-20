import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const runSyncScript = () =>
  new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
    const child = spawn(process.execPath, ['scripts/syncMarketplaceOffers.js'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SEARCH_QUERY: process.env.MARKETPLACE_SYNC_QUERY || 'coffee',
        SELLERS: process.env.MARKETPLACE_SYNC_SELLERS || 'daraz,chaldal,rokomari,startech,aliexpress,alibaba',
        MAX_PER_SELLER: process.env.MARKETPLACE_SYNC_MAX_PER_SELLER || '120',
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

  const result = await runSyncScript();

  if (result.code !== 0) {
    return NextResponse.json(
      {
        ok: false,
        code: result.code,
        stderr: result.stderr.slice(-4000),
        stdout: result.stdout.slice(-4000),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    code: result.code,
    stdout: result.stdout.slice(-4000),
  });
}
