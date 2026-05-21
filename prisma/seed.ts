import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../src/lib/demo-seed";

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await seedDemoData(prisma);
    console.log(`✅ Seeded ${count} demo decisions for org "demo-dao".`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
