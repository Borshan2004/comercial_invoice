import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let profiles = await prisma.manufacturerProfile.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const existingCompanies = new Set(profiles.map((p) => p.company.toLowerCase()));

    // Seed default Pacific Blue Jeans Wear Ltd if not present
    const defaultCompanyName = 'PACIFIC BLUE JEANS WEAR LTD (Al muslim group)';
    if (!existingCompanies.has(defaultCompanyName.toLowerCase())) {
      try {
        const defaultProfile = await prisma.manufacturerProfile.create({
          data: {
            company: defaultCompanyName,
            address: 'A-8/1, JALESHWAR, SAVAR',
            city: 'Dhaka',
            postalCode: '1340',
            country: 'Bangladesh',
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
      take: 100,
    });

    for (const ch of recentChallans) {
      if (
        ch.manufCompany &&
        ch.manufCompany.trim().length > 0 &&
        !existingCompanies.has(ch.manufCompany.trim().toLowerCase())
      ) {
        try {
          const created = await prisma.manufacturerProfile.create({
            data: {
              company: ch.manufCompany.trim(),
              address: ch.manufAddress || '',
              city: ch.manufCity || '',
              postalCode: ch.manufPostalCode || '',
              country: ch.manufCountry || '',
            },
          });
          profiles.push(created);
          existingCompanies.add(ch.manufCompany.trim().toLowerCase());
        } catch (e) {
          // ignore duplicate race
        }
      }
    }

    return NextResponse.json({ manufacturers: profiles });
  } catch (err: any) {
    console.error('Fetch manufacturer profiles error:', err);
    return NextResponse.json({ error: 'Failed to fetch manufacturers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { company, address, city, postalCode, country } = body;

    if (!company || typeof company !== 'string' || !company.trim()) {
      return NextResponse.json({ error: 'Manufacturer company name is required' }, { status: 400 });
    }

    const profile = await prisma.manufacturerProfile.upsert({
      where: { company: company.trim() },
      update: {
        address: address ? address.trim() : '',
        city: city ? city.trim() : '',
        postalCode: postalCode ? postalCode.trim() : '',
        country: country ? country.trim() : '',
      },
      create: {
        company: company.trim(),
        address: address ? address.trim() : '',
        city: city ? city.trim() : '',
        postalCode: postalCode ? postalCode.trim() : '',
        country: country ? country.trim() : '',
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    console.error('Save manufacturer profile error:', err);
    return NextResponse.json({ error: 'Failed to save manufacturer profile' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin permissions required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, company } = body;

    if (id) {
      await prisma.manufacturerProfile.delete({ where: { id } });
    } else if (company) {
      await prisma.manufacturerProfile.delete({ where: { company: company.trim() } });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete manufacturer profile error:', err);
    return NextResponse.json({ error: 'Failed to delete manufacturer profile' }, { status: 500 });
  }
}
