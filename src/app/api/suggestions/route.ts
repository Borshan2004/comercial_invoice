import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const field = searchParams.get('field');

    const where = field ? { field } : {};

    const suggestions = await prisma.fieldSuggestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Also fetch ParticularSuggestion for legacy garment suggestions
    const particularLegacy = await prisma.particularSuggestion.findMany({
      orderBy: { order: 'asc' },
    });

    // Group suggestions by field
    const grouped: Record<string, { id: string; value: string }[]> = {};

    suggestions.forEach((s) => {
      if (!grouped[s.field]) {
        grouped[s.field] = [];
      }
      grouped[s.field].push({ id: s.id, value: s.value });
    });

    // Add legacy particulars if not already present
    if (!grouped['particular']) {
      grouped['particular'] = [];
    }
    const existingParticularValues = new Set(grouped['particular'].map((p) => p.value.toLowerCase()));

    particularLegacy.forEach((pl) => {
      if (!existingParticularValues.has(pl.name.toLowerCase())) {
        grouped['particular'].push({ id: `legacy-${pl.id}`, value: pl.name });
        existingParticularValues.add(pl.name.toLowerCase());
      }
    });

    if (field) {
      return NextResponse.json({ suggestions: grouped[field] || [] });
    }

    return NextResponse.json({ suggestions: grouped });
  } catch (err: any) {
    console.error('Fetch suggestions error:', err);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Both USER and ADMIN can automatically save suggestions
    const body = await request.json();
    const { field, value, items } = body;

    // Handle single or bulk
    const toSave: { field: string; value: string }[] = [];

    if (items && Array.isArray(items)) {
      items.forEach((item: any) => {
        if (item.field && item.value && typeof item.value === 'string' && item.value.trim()) {
          toSave.push({ field: item.field.trim(), value: item.value.trim() });
        }
      });
    } else if (field && value && typeof value === 'string' && value.trim()) {
      toSave.push({ field: field.trim(), value: value.trim() });
    }

    if (toSave.length === 0) {
      return NextResponse.json({ error: 'No valid suggestions to save' }, { status: 400 });
    }

    const saved: any[] = [];
    for (const item of toSave) {
      try {
        const res = await prisma.fieldSuggestion.upsert({
          where: {
            field_value: {
              field: item.field,
              value: item.value,
            },
          },
          update: {},
          create: {
            field: item.field,
            value: item.value,
          },
        });
        saved.push(res);
      } catch (e) {
        // Continue if duplicate or conflict
      }
    }

    return NextResponse.json({ success: true, count: saved.length });
  } catch (err: any) {
    console.error('Save suggestions error:', err);
    return NextResponse.json({ error: 'Failed to save suggestions' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // STRICT CHECK: Only ADMIN can delete suggestions!
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permission denied. Only administrators can delete suggestions.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    let bodyId = null;
    let bodyField = null;
    let bodyValue = null;

    try {
      const body = await request.json();
      bodyId = body.id;
      bodyField = body.field;
      bodyValue = body.value;
    } catch (e) {
      // json may be empty if params used
    }

    const targetId = id || bodyId;

    if (targetId) {
      if (targetId.startsWith('legacy-')) {
        const legacyId = parseInt(targetId.replace('legacy-', ''), 10);
        if (!isNaN(legacyId)) {
          await prisma.particularSuggestion.delete({
            where: { id: legacyId },
          });
        }
      } else {
        await prisma.fieldSuggestion.delete({
          where: { id: targetId },
        });
      }
      return NextResponse.json({ success: true, message: 'Suggestion deleted' });
    }

    if (bodyField && bodyValue) {
      await prisma.fieldSuggestion.deleteMany({
        where: { field: bodyField, value: bodyValue },
      });
      if (bodyField === 'particular') {
        await prisma.particularSuggestion.deleteMany({
          where: { name: bodyValue },
        });
      }
      if (bodyField === 'name') {
        await prisma.consigneeProfile.deleteMany({
          where: { name: bodyValue },
        });
      }
      return NextResponse.json({ success: true, message: 'Suggestion deleted' });
    }

    return NextResponse.json({ error: 'Suggestion id or field/value is required' }, { status: 400 });
  } catch (err: any) {
    console.error('Delete suggestion error:', err);
    return NextResponse.json({ error: 'Failed to delete suggestion' }, { status: 500 });
  }
}
