import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let profiles = await prisma.consigneeProfile.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    // Sync from previous Challan records if any exist but not in profiles
    const existingNames = new Set(profiles.map((p) => p.name.toLowerCase()));
    const recentChallans = await prisma.challan.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    for (const ch of recentChallans) {
      if (ch.name && !existingNames.has(ch.name.toLowerCase())) {
        try {
          const created = await prisma.consigneeProfile.create({
            data: {
              name: ch.name.trim(),
              address: ch.address || '',
              attn: ch.consigneeAttn || null,
              city: ch.consigneeCity || '',
              postal: ch.consigneePostal || '',
              country: ch.consigneeCountry || '',
              phone: ch.consigneePhone || '',
              email: ch.consigneeEmail || '',
              taxId: ch.consigneeTaxId || '',
            },
          });
          profiles.push(created);
          existingNames.add(ch.name.toLowerCase());
        } catch (e) {
          // ignore duplicate race
        }
      }
    }

    return NextResponse.json({ consignees: profiles });
  } catch (err: any) {
    console.error('Fetch consignee profiles error:', err);
    return NextResponse.json({ error: 'Failed to fetch consignees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, attn, city, postal, country, phone, email, taxId } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Consignee company name is required' }, { status: 400 });
    }

    const profile = await prisma.consigneeProfile.upsert({
      where: { name: name.trim() },
      update: {
        address: address ? address.trim() : '',
        attn: attn ? attn.trim() : null,
        city: city ? city.trim() : '',
        postal: postal ? postal.trim() : '',
        country: country ? country.trim() : '',
        phone: phone ? phone.trim() : '',
        email: email ? email.trim() : '',
        taxId: taxId ? taxId.trim() : '',
      },
      create: {
        name: name.trim(),
        address: address ? address.trim() : '',
        attn: attn ? attn.trim() : null,
        city: city ? city.trim() : '',
        postal: postal ? postal.trim() : '',
        country: country ? country.trim() : '',
        phone: phone ? phone.trim() : '',
        email: email ? email.trim() : '',
        taxId: taxId ? taxId.trim() : '',
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    console.error('Save consignee profile error:', err);
    return NextResponse.json({ error: 'Failed to save consignee profile' }, { status: 500 });
  }
}
