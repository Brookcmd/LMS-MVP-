import dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL is not set in backend/.env");
}

const pool = new Pool({
	connectionString,
	ssl: {
		rejectUnauthorized: false,
	},
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
	adapter,
});