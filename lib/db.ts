import 'server-only';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { GhostSighting } from './types';

// Mirrors the PostgREST max-rows cap (1000) the app ran under on Supabase,
// so no single request returns all ~12k rows.
export const MAX_ROWS = 1000;

let _sql: NeonQueryFunction<false, false> | null = null;

// Lazily created so `next build` does not need the connection string.
export function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new Error('Missing NEON_DATABASE_URL environment variable');
  }
  _sql = neon(url);
  return _sql;
}

// Rows are serialized by Postgres itself (json_agg / row_to_json), so dates, timestamps
// and numerics come back in exactly the JSON shape PostgREST (Supabase) produced.

// Helper function to fetch all sightings
export async function getAllSightings(): Promise<GhostSighting[]> {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT coalesce(json_agg(t), '[]'::json) AS data FROM (
        SELECT * FROM ghost_sightings ORDER BY date_of_sighting DESC LIMIT ${MAX_ROWS}
      ) t`;
    return rows[0].data as GhostSighting[];
  } catch (error) {
    console.error('Error fetching sightings:', error);
    return [];
  }
}

// Helper function to add a new sighting
export async function addSighting(sighting: Omit<GhostSighting, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO ghost_sightings
        (date_of_sighting, latitude, longitude, city, state, notes, time_of_day, apparition_tag, image_link)
      VALUES
        (${sighting.date_of_sighting}, ${sighting.latitude}, ${sighting.longitude}, ${sighting.city},
         ${sighting.state}, ${sighting.notes}, ${sighting.time_of_day}, ${sighting.apparition_tag},
         ${sighting.image_link})
      RETURNING row_to_json(ghost_sightings.*) AS data`;
    return rows[0].data as GhostSighting;
  } catch (error) {
    console.error('Error adding sighting:', error);
    throw error;
  }
}

// Helper function to get sightings by location
export async function getSightingsByState(state: string): Promise<GhostSighting[]> {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT coalesce(json_agg(t), '[]'::json) AS data FROM (
        SELECT * FROM ghost_sightings WHERE state = ${state}
        ORDER BY date_of_sighting DESC LIMIT ${MAX_ROWS}
      ) t`;
    return rows[0].data as GhostSighting[];
  } catch (error) {
    console.error('Error fetching sightings by state:', error);
    return [];
  }
}

// Helper function to get sightings within a bounding box
export async function getSightingsInBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
): Promise<GhostSighting[]> {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT coalesce(json_agg(t), '[]'::json) AS data FROM (
        SELECT * FROM ghost_sightings
        WHERE latitude >= ${minLat} AND latitude <= ${maxLat}
          AND longitude >= ${minLng} AND longitude <= ${maxLng}
        LIMIT ${MAX_ROWS}
      ) t`;
    return rows[0].data as GhostSighting[];
  } catch (error) {
    console.error('Error fetching sightings in bounds:', error);
    return [];
  }
}
