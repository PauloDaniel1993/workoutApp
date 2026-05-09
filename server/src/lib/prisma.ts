import dotenv from 'dotenv'
import { PrismaClient } from '../../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

dotenv.config()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
