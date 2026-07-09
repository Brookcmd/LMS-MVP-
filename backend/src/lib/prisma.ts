import dotenv from "dotenv";
import path from "path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL is not set in backend/.env");
}

const adapter = new PrismaPg({
	connectionString,
});

export const prisma = new PrismaClient({
	adapter,
});