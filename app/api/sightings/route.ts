import { NextResponse } from 'next/server';
import { getSql, MAX_ROWS } from '@/lib/db';

export const dynamic = 'force-dynamic';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { date_of_sighting, latitude, longitude } = body;

    if (!date_of_sighting || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: date_of_sighting, latitude, longitude' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates. Latitude and longitude must be numbers.' },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of range. Latitude: -90 to 90, Longitude: -180 to 180' },
        { status: 400 }
      );
    }

    const sql = getSql();

    // Insert into database (row serialized by Postgres, same JSON shape as before)
    let data;
    try {
      const rows = await sql`
        INSERT INTO ghost_sightings
          (date_of_sighting, latitude, longitude, city, state, notes, time_of_day, apparition_tag, image_link)
        VALUES (
          ${body.date_of_sighting},
          ${lat},
          ${lng},
          ${body.city || null},
          ${body.state || null},
          ${body.notes || null},
          ${body.time_of_day || null},
          ${body.apparition_tag || null},
          ${body.image_link || null}
        )
        RETURNING row_to_json(ghost_sightings.*) AS data`;
      data = rows[0].data;
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to add sighting to database', details: errorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch sightings (newest first; `limit` defaults to 100, capped at MAX_ROWS)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), MAX_ROWS);
    const state = searchParams.get('state');

    const sql = getSql();

    try {
      const rows = state
        ? await sql`
            SELECT coalesce(json_agg(t), '[]'::json) AS data FROM (
              SELECT * FROM ghost_sightings WHERE state = ${state}
              ORDER BY date_of_sighting DESC LIMIT ${limit}
            ) t`
        : await sql`
            SELECT coalesce(json_agg(t), '[]'::json) AS data FROM (
              SELECT * FROM ghost_sightings
              ORDER BY date_of_sighting DESC LIMIT ${limit}
            ) t`;

      return NextResponse.json({ data: rows[0].data }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch sightings', details: errorMessage(error) },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
