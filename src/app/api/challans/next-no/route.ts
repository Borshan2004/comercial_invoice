import { NextResponse } from 'next/server';
import { generateUniqueInvoiceNo } from '@/lib/challan-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const invoiceNo = await generateUniqueInvoiceNo();
    return NextResponse.json({ invoiceNo });
  } catch (error: any) {
    console.error('Failed to generate next invoice no:', error);
    return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
  }
}
