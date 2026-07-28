import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'];
  const password = await bcrypt.hash('password123', 10);

  console.log('Seeding database with test users...');

  for (const role of roles) {
    const email = `${role.toLowerCase()}@erp.com`;
    
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password,
        role,
      },
    });
    console.log(`Created user: ${email} | Password: password123`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });