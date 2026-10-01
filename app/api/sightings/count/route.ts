import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Total number of sightings (stats card, and the cheap check the home page polls for new rows).
export async function GET() {
  try {
    const sql = getSql();
    try {
      const rows = await sql`SELECT count(*)::int AS count FROM ghost_sightings`;
      return NextResponse.json({ count: rows[0].count }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to count sightings', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
