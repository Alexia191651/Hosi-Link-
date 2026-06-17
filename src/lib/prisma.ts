import prismaClientPackage from '@prisma/client'

const { PrismaClient } = prismaClientPackage as unknown as {
  PrismaClient: new (...args: any[]) => any
}

type PrismaClientInstance = InstanceType<typeof PrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 