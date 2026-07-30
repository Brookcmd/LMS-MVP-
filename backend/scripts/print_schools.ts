import { prisma } from "../src/lib/prisma";

async function main() {
  const schools = await prisma.school.findMany();
  console.log(JSON.stringify(schools, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
