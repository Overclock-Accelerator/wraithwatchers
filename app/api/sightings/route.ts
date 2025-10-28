import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations (more secure)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('ghost_sightings')
      .insert([{
        date_of_sighting: body.date_of_sighting,
        latitude: lat,
        longitude: lng,
        city: body.city || null,
        state: body.state || null,
        notes: body.notes || null,
        time_of_day: body.time_of_day || null,
        apparition_tag: body.apparition_tag || null,
        image_link: body.image_link || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to add sighting to database', details: error.message },
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

// Optional: GET endpoint to fetch sightings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const state = searchParams.get('state');

    let query = supabaseAdmin
      .from('ghost_sightings')
      .select('*')
      .order('date_of_sighting', { ascending: false })
      .limit(limit);

    if (state) {
      query = query.eq('state', state);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch sightings', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

