import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateUniqueInvoiceNo, getCurrentDhakaDate, formatValueInWords } from '@/lib/challan-utils';
import { autoSaveInvoiceSuggestions } from '@/lib/suggestions-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (search) {
      where.OR = [
        { challanNo: { contains: search, mode: 'insensitive' } },
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { awbNo: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { consigneeAttn: { contains: search, mode: 'insensitive' } },
        { shipperCompany: { contains: search, mode: 'insensitive' } },
        { manufCompany: { contains: search, mode: 'insensitive' } },
        { midCode: { contains: search, mode: 'insensitive' } },
        {
          items: {
            some: {
              OR: [
                { particular: { contains: search, mode: 'insensitive' } },
                { harmonizedCode: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const challans = await withRetry(() => prisma.challan.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, username: true, role: true },
        },
        items: {
          orderBy: { slNo: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }));

    return NextResponse.json({ challans });
  } catch (err: any) {
    console.error('Fetch challans error:', err);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Both ADMIN and USER can create / save new records
    const body = await request.json();
    const {
      challanNo: customChallanNo,
      invoiceNo: customInvoiceNo,
      awbNo: customAwbNo,
      totalWeight: customTotalWeight,
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
      manufCompany = 'PACIFIC BLUE JEANS WEAR LTD (Al muslim group)',
      manufAddress = 'A-8/1, JALESHWAR, SAVAR',
      manufCity = 'Dhaka',
      manufPostalCode = '1340',
      manufCountry = 'Bangladesh',
      // Consignee
      name = 'Bernette Textile Co.Ltd',
      address = '42 West, 39th Street, 11th Floor,',
      consigneeAttn = 'Nicole / Joey',
      consigneeCity = 'New York',
      consigneePostal = 'NY 10018',
      consigneeCountry = 'USA',
      consigneePhone = '212-279-5526',
      consigneeEmail = 'nwezowicz@btexusa.com',
      consigneeTaxId = '320249666',
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

    // 1. AWB NO: input system, if no input then empty (null)
    const awbNo = customAwbNo && typeof customAwbNo === 'string' && customAwbNo.trim() ? customAwbNo.trim() : null;

    // 2. INVOICE NO: automatic format "Asi-02564" (5 digits)
    let invoiceNo = customInvoiceNo?.trim() || customChallanNo?.trim();
    if (!invoiceNo || !invoiceNo.toLowerCase().startsWith('asi-')) {
      invoiceNo = await generateUniqueInvoiceNo();
    }
    const challanNo = invoiceNo;

    // 3. TOTAL WEIGHT: e.g. "1.50 KG"
    const totalWeight = customTotalWeight && typeof customTotalWeight === 'string' && customTotalWeight.trim()
      ? customTotalWeight.trim()
      : null;

    const docDate = customDate ? new Date(customDate) : getCurrentDhakaDate();

    // Calculate totals
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

    const newChallan = await prisma.challan.create({
      data: {
        challanNo,
        invoiceNo,
        awbNo,
        totalWeight,
        date: docDate,
        shipperCompany: shipperCompany.trim(),
        shipperAttn: shipperAttn ? shipperAttn.trim() : null,
        shipperAddress: shipperAddress.trim(),
        shipperCity: shipperCity.trim(),
        shipperPostalCode: shipperPostalCode.trim(),
        shipperCountry: shipperCountry.trim(),
        shipperPhone: shipperPhone.trim(),
        shipperEmail: shipperEmail.trim(),

        manufCompany: manufCompany.trim(),
        manufAddress: manufAddress.trim(),
        manufCity: manufCity.trim(),
        manufPostalCode: manufPostalCode.trim(),
        manufCountry: manufCountry.trim(),

        name: name.trim(),
        address: address.trim(),
        consigneeAttn: consigneeAttn ? consigneeAttn.trim() : null,
        consigneeCity: consigneeCity ? consigneeCity.trim() : '',
        consigneePostal: consigneePostal ? consigneePostal.trim() : '',
        consigneeCountry: consigneeCountry ? consigneeCountry.trim() : '',
        consigneePhone: consigneePhone ? consigneePhone.trim() : '',
        consigneeEmail: consigneeEmail ? consigneeEmail.trim() : '',
        consigneeTaxId: consigneeTaxId ? consigneeTaxId.trim() : '',

        countryOfOrigin: countryOfOrigin.trim(),
        midCode: midCode.trim(),
        purpose: purpose.trim(),
        totalValueInWords: finalWords,
        totalAmountUsd,

        totalQty,
        totalYdsKg: 0.0,
        notes: notes.trim(),
        createdById: session.userId,
        items: {
          create: formattedItems,
        },
      },
      include: {
        items: {
          orderBy: { slNo: 'asc' },
        },
      },
    });

    // Automatically save field values as suggestions for future autocomplete
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

    return NextResponse.json({ success: true, challan: newChallan });
  } catch (err: any) {
    console.error('Create invoice error:', err);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
