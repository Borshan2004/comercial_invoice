import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ChallanForm from '@/components/ChallanForm';

export const dynamic = 'force-dynamic';

export default async function EditChallanPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Regular users cannot edit, ONLY Admin can edit
  if (session.role !== 'ADMIN') {
    redirect(`/challans/${params.id}`);
  }

  const challan = await prisma.challan.findUnique({
    where: { id: params.id },
    include: {
      items: {
        orderBy: { slNo: 'asc' },
      },
    },
  });

  if (!challan) {
    notFound();
  }

  return (
    <ChallanForm
      isEdit={true}
      currentUserRole={session.role}
      initialData={{
        id: challan.id,
        challanNo: challan.challanNo,
        invoiceNo: challan.invoiceNo,
        awbNo: challan.awbNo,
        totalWeight: challan.totalWeight,
        date: challan.date,

        shipperCompany: challan.shipperCompany,
        shipperAttn: challan.shipperAttn,
        shipperAddress: challan.shipperAddress,
        shipperCity: challan.shipperCity,
        shipperPostalCode: challan.shipperPostalCode,
        shipperCountry: challan.shipperCountry,
        shipperPhone: challan.shipperPhone,
        shipperEmail: challan.shipperEmail,

        manufCompany: challan.manufCompany,
        manufAddress: challan.manufAddress,
        manufCity: challan.manufCity,
        manufPostalCode: challan.manufPostalCode,
        manufCountry: challan.manufCountry,

        name: challan.name,
        address: challan.address,
        consigneeAttn: challan.consigneeAttn,
        consigneeCity: challan.consigneeCity,
        consigneePostal: challan.consigneePostal,
        consigneeCountry: challan.consigneeCountry,
        consigneePhone: challan.consigneePhone,
        consigneeEmail: challan.consigneeEmail,
        consigneeTaxId: challan.consigneeTaxId,

        countryOfOrigin: challan.countryOfOrigin,
        midCode: challan.midCode,
        purpose: challan.purpose,
        totalValueInWords: challan.totalValueInWords,
        totalAmountUsd: challan.totalAmountUsd,
        notes: challan.notes,

        items: challan.items.map((i) => ({
          slNo: i.slNo,
          particular: i.particular,
          harmonizedCode: i.harmonizedCode || '',
          qty: i.qty ?? 0,
          unit: i.unit || 'PCS',
          unitValueUsd: i.unitValueUsd ?? 1.0,
          totalValueUsd: i.totalValueUsd ?? 0.0,
        })),
      }}
    />
  );
}
