import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
  // Detect if schema has changed — recreate client if models are missing
  if (!prisma.material || typeof prisma.material.findMany !== "function") {
    global.__prisma = new PrismaClient();
    prisma = global.__prisma;
  }
}

export { prisma };
