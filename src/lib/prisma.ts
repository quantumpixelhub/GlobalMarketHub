// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const withConservativePool = (databaseUrl: string | undefined) => {
  if (!databaseUrl) return undefined;

  try {
    const parsed = new URL(databaseUrl);

    // Supabase session mode (5432) can exhaust client slots quickly with Prisma.
    // Move to transaction mode pooler port for more reliable API auth/login traffic.
    if (
      parsed.hostname.endsWith('pooler.supabase.com') &&
      (parsed.port === '' || parsed.port === '5432')
    ) {
      parsed.port = '6543';
      parsed.searchParams.set('pgbouncer', 'true');
    }

    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', '1');
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '20');
    }
    return parsed.toString();
  } catch {
    return databaseUrl;
  }
};

const optimizedDatabaseUrl = withConservativePool(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(optimizedDatabaseUrl
      ? { datasources: { db: { url: optimizedDatabaseUrl } } }
      : {}),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
