// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

export const prisma = new PrismaClient();
// eslint-disable-next-line @typescript-eslint/no-require-imports
export * from '@prisma/client';
