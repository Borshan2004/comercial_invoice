import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChallanExcel } from '@/lib/excel-export';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { slNo: 'asc' },
        },
      },
    });

    if (!challan) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const buffer = await generateChallanExcel({
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
        harmonizedCode: i.harmonizedCode,
        qty: i.qty,
        unit: i.unit,
        unitValueUsd: i.unitValueUsd,
        totalValueUsd: i.totalValueUsd,
      })),
    });

    const safeFilename = challan.challanNo.replace(/\s+/g, '-');

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="COMMERCIAL-INVOICE-${safeFilename}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error('Excel download error:', err);
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 });
  }
}
