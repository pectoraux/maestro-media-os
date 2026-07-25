import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// On Vercel (serverless): copy the build-time SQLite DB to /tmp (writable on serverless)
// This ensures the database is available at runtime even though serverless functions
// have an ephemeral filesystem. The build step creates db/custom.db with schema + seed data.
if (process.env.VERCEL || process.env.DATABASE_URL?.includes('/tmp/')) {
  const tmpDbPath = '/tmp/maestro.db'
  if (!fs.existsSync(tmpDbPath)) {
    // Try to copy from the build-time database
    const buildDbPaths = [
      path.join(process.cwd(), 'db', 'custom.db'),
      path.join(process.cwd(), 'db', 'maestro.db'),
    ]
    for (const buildDb of buildDbPaths) {
      try {
        if (fs.existsSync(buildDb)) {
          fs.copyFileSync(buildDb, tmpDbPath)
          break
        }
      } catch {
        // may be read-only or not exist
      }
    }
  }
  // Override DATABASE_URL to use the /tmp copy (writable on serverless)
  process.env.DATABASE_URL = `file:${tmpDbPath}`
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
