import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatValueInWords } from '@/lib/challan-utils';
import { autoSaveInvoiceSuggestions } from '@/lib/suggestions-utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true, role: true },
        },
        items: {
          orderBy: { slNo: 'asc' },
        },
      },
    });

    if (!challan) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ challan });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // STRICT CHECK: Regular users cannot edit, only ADMIN can edit
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permission denied. Only administrators can edit existing records.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      challanNo,
      invoiceNo,
      awbNo,
      totalWeight,
      date: customDate,
      // Shipper
      shipperCompany = "Apparel Sourcing Int'l Inc",
      shipperAttn = 'Gunjan',
      shipperAddress = 'House#30, 3rd Floor, Western Road, Banani DOHS',
      shipperCity = 'Dhaka',
      shipperPostalCode = '1206',
      shipperCountry = 'Bangladesh',
      shipperPhone = '880 1774-109199',
      shipperEmail = 'afaz@apparelsourcingint.com',
      // Manufacturer
      manufCompany = '',
      manufAddress = '',
      manufCity = '',
      manufPostalCode = '',
      manufCountry = '',
      // Consignee
      name,
      address,
      consigneeAttn,
      consigneeCity,
      consigneePostal,
      consigneeCountry,
      consigneePhone,
      consigneeEmail,
      consigneeTaxId,
      // Origin & Codes
      countryOfOrigin = 'BANGLADESH',
      midCode = 'BDASIINC1206DHA',
      purpose = 'SAMPLE FOR APPROVAL PURPOSE',
      totalValueInWords,
      notes = '** THESE ARE SAMPLE SHIPMENTS, SENT FREE OF COST BASIS. SHOWING VALUE FOR CUSTOMS PURPOSES ONLY.',
      items = [],
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Consignee Company Name is required' }, { status: 400 });
    }

    // Calculate totals on server
    let totalQty = 0;
    let totalAmountUsd = 0;

    const formattedItems = items
      .filter((item: any) => item.particular && item.particular.trim() !== '')
      .map((item: any, idx: number) => {
        const qty = parseInt(item.qty, 10) || 0;
        const unitVal = parseFloat(item.unitValueUsd) || 0.0;
        const totalVal = Math.round((qty * unitVal) * 100) / 100;
        totalQty += qty;
        totalAmountUsd += totalVal;

        return {
          slNo: idx + 1,
          particular: item.particular.trim(),
          harmonizedCode: item.harmonizedCode ? item.harmonizedCode.trim() : '',
          qty,
          unit: item.unit || 'PCS',
          unitValueUsd: unitVal,
          totalValueUsd: totalVal,
          ydsKg: 0.0,
          ydsUnit: 'yds',
        };
      });

    totalAmountUsd = Math.round(totalAmountUsd * 100) / 100;

    const finalWords = totalValueInWords && totalValueInWords.trim()
      ? totalValueInWords.trim()
      : formatValueInWords(totalAmountUsd);

    // Delete existing items and recreate to maintain sequence
    await prisma.challanItem.deleteMany({
      where: { challanId: params.id },
    });

    const updateData: any = {
      name: name.trim(),
      address: address ? address.trim() : '',
      consigneeAttn: consigneeAttn ? consigneeAttn.trim() : null,
      consigneeCity: consigneeCity ? consigneeCity.trim() : '',
      consigneePostal: consigneePostal ? consigneePostal.trim() : '',
      consigneeCountry: consigneeCountry ? consigneeCountry.trim() : '',
      consigneePhone: consigneePhone ? consigneePhone.trim() : '',
      consigneeEmail: consigneeEmail ? consigneeEmail.trim() : '',
      consigneeTaxId: consigneeTaxId ? consigneeTaxId.trim() : '',

      shipperCompany: shipperCompany.trim(),
      shipperAttn: shipperAttn ? shipperAttn.trim() : null,
      shipperAddress: shipperAddress.trim(),
      shipperCity: shipperCity.trim(),
      shipperPostalCode: shipperPostalCode.trim(),
      shipperCountry: shipperCountry.trim(),
      shipperPhone: shipperPhone.trim(),
      shipperEmail: shipperEmail.trim(),

      manufCompany: (manufCompany || '').trim(),
      manufAddress: (manufAddress || '').trim(),
      manufCity: (manufCity || '').trim(),
      manufPostalCode: (manufPostalCode || '').trim(),
      manufCountry: (manufCountry || '').trim(),

      countryOfOrigin: (countryOfOrigin || '').trim(),
      midCode: (midCode || '').trim(),
      purpose: (purpose || '').trim(),
      awbNo: awbNo !== undefined ? (awbNo && awbNo.trim() ? awbNo.trim() : null) : undefined,
      invoiceNo: invoiceNo !== undefined ? (invoiceNo && invoiceNo.trim() ? invoiceNo.trim() : null) : undefined,
      totalWeight: totalWeight !== undefined ? (totalWeight && totalWeight.trim() ? totalWeight.trim() : null) : undefined,
      totalValueInWords: finalWords,
      totalAmountUsd,

      totalQty,
      notes: (notes || '').trim(),
      items: {
        create: formattedItems,
      },
    };

    if (challanNo && challanNo.trim()) {
      updateData.challanNo = challanNo.trim();
    }
    if (customDate) {
      updateData.date = new Date(customDate);
    }

    const updated = await prisma.challan.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: {
          orderBy: { slNo: 'asc' },
        },
      },
    });

    // Automatically save updated fields as suggestions
    autoSaveInvoiceSuggestions({
      name,
      address,
      consigneeAttn,
      consigneeCity,
      consigneePostal,
      consigneeCountry,
      consigneePhone,
      consigneeEmail,
      consigneeTaxId,
      shipperCompany,
      shipperAttn,
      shipperAddress,
      shipperCity,
      shipperPostalCode,
      shipperCountry,
      shipperPhone,
      shipperEmail,
      manufCompany,
      manufAddress,
      manufCity,
      manufPostalCode,
      manufCountry,
      countryOfOrigin,
      midCode,
      purpose,
      awbNo,
      totalWeight,
      notes,
      items: formattedItems,
    }).catch((err) => console.error('Auto save suggestions error:', err));

    return NextResponse.json({ success: true, challan: updated });
  } catch (err: any) {
    console.error('Update invoice error:', err);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await prisma.challan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err: any) {
    console.error('Delete invoice error:', err);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
