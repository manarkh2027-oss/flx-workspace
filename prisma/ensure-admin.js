// Idempotent: guarantees the owner admin account exists on every deploy,
// WITHOUT wiping data (unlike seed.js). Runs in vercel-build after the seed.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const ws = await prisma.workspace.findFirst({ orderBy: { id: 'asc' } });
  if (!ws) {
    console.log('ensure-admin: no workspace yet — skipping (seed will create it).');
    return;
  }
  const passwordHash = bcrypt.hashSync('khalaf123$', 10);
  await prisma.user.upsert({
    where: { username: 'flx' },
    update: { passwordHash, role: 'super_admin' },
    create: {
      workspaceId: ws.id,
      username: 'flx',
      passwordHash,
      fullName: 'FLX',
      role: 'super_admin',
      email: 'admin@flxcreative.ps',
    },
  });
  console.log('ensure-admin: flx super_admin account is ready.');
}

main()
  .catch((e) => { console.error('ensure-admin failed:', e); process.exit(0); })
  .finally(() => prisma.$disconnect());
