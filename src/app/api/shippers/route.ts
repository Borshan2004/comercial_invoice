import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let profiles = await prisma.shipperProfile.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const existingCompanies = new Set(profiles.map((p) => p.company.toLowerCase()));

    // Seed default Apparel Sourcing Int'l Inc if not present
    const defaultCompanyName = "Apparel Sourcing Int'l Inc";
    if (!existingCompanies.has(defaultCompanyName.toLowerCase())) {
      try {
        const defaultProfile = await prisma.shipperProfile.create({
          data: {
            company: defaultCompanyName,
            attn: 'Gunjan',
            address: 'House#30, 3rd Floor, Western Road, Banani DOHS',
            city: 'Dhaka',
            postalCode: '1206',
            country: 'Bangladesh',
            phone: '880 1774-109199',
            email: 'afaz@apparelsourcingint.com',
          },
        });
        profiles.push(defaultProfile);
        existingCompanies.add(defaultCompanyName.toLowerCase());
      } catch (e) {
        // ignore duplicate race
      }
    }

    // Sync from previous Challan records if any exist but not in profiles
    const recentChallans = await prisma.challan.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    for (const ch of recentChallans) {
      if (ch.shipperCompany && !existingCompanies.has(ch.shipperCompany.toLowerCase())) {
        try {
          const created = await prisma.shipperProfile.create({
            data: {
              company: ch.shipperCompany.trim(),
              attn: ch.shipperAttn || null,
              address: ch.shipperAddress || '',
              city: ch.shipperCity || '',
              postalCode: ch.shipperPostalCode || '',
              country: ch.shipperCountry || '',
              phone: ch.shipperPhone || '',
              email: ch.shipperEmail || '',
            },
          });
          profiles.push(created);
          existingCompanies.add(ch.shipperCompany.toLowerCase());
        } catch (e) {
          // ignore duplicate race
        }
      }
    }

    return NextResponse.json({ shippers: profiles });
  } catch (err: any) {
    console.error('Fetch shipper profiles error:', err);
    return NextResponse.json({ error: 'Failed to fetch shippers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { company, attn, address, city, postalCode, country, phone, email } = body;

    if (!company || typeof company !== 'string' || !company.trim()) {
      return NextResponse.json({ error: 'Shipper company name is required' }, { status: 400 });
    }

    const profile = await prisma.shipperProfile.upsert({
      where: { company: company.trim() },
      update: {
        attn: attn ? attn.trim() : null,
        address: address ? address.trim() : '',
        city: city ? city.trim() : '',
        postalCode: postalCode ? postalCode.trim() : '',
        country: country ? country.trim() : '',
        phone: phone ? phone.trim() : '',
        email: email ? email.trim() : '',
      },
      create: {
        company: company.trim(),
        attn: attn ? attn.trim() : null,
        address: address ? address.trim() : '',
        city: city ? city.trim() : '',
        postalCode: postalCode ? postalCode.trim() : '',
        country: country ? country.trim() : '',
        phone: phone ? phone.trim() : '',
        email: email ? email.trim() : '',
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    console.error('Save shipper profile error:', err);
    return NextResponse.json({ error: 'Failed to save shipper profile' }, { status: 500 });
  }
}
