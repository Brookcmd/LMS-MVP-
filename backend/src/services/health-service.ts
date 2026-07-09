import { prisma } from "../lib/prisma";

export async function checkDatabaseHealth() {
  const [row] = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;

  return {
    status: "ok",
    database: row?.ok === 1 ? "connected" : "unavailable",
  };
}