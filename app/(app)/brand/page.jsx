import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveClientId } from '@/lib/access';
import { canEditBrand } from '@/lib/permissions';
import BrandHub from '@/components/BrandHub';

export const dynamic = 'force-dynamic';

export default async function BrandPage() {
  const user = await getCurrentUser();
  const clientId = await getActiveClientId(user);
  const client = clientId ? await prisma.client.findUnique({ where: { id: clientId } }) : null;

  let brand = { colors: [], fonts: [], voiceOk: [], voiceNo: [], gallery: [] };
  try { if (client?.brandJson) brand = { ...brand, ...JSON.parse(client.brandJson) }; } catch {}

  const safeClient = {
    name: client?.name || '',
    nameAr: client?.nameAr || '',
    initials: client?.initials || 'ن',
    logoUrl: client?.logoUrl || '',
  };

  return <BrandHub canEdit={canEditBrand(user?.role)} client={safeClient} brand={brand} />;
}
