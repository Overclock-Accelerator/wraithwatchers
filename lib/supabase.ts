import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definition for ghost sighting
export interface GhostSighting {
  id: string;
  date_of_sighting: string;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  notes: string | null;
  time_of_day: string | null;
  apparition_tag: string | null;
  image_link: string | null;
  created_at: string;
  updated_at: string;
}

// Helper function to fetch all sightings
export async function getAllSightings() {
  const { data, error } = await supabase
    .from('ghost_sightings')
    .select('*')
    .order('date_of_sighting', { ascending: false });

  if (error) {
    console.error('Error fetching sightings:', error);
    return [];
  }

  return data as GhostSighting[];
}

// Helper function to add a new sighting
export async function addSighting(sighting: Omit<GhostSighting, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('ghost_sightings')
    .insert([sighting])
    .select()
    .single();

  if (error) {
    console.error('Error adding sighting:', error);
    throw error;
  }

  return data as GhostSighting;
}

// Helper function to get sightings by location
export async function getSightingsByState(state: string) {
  const { data, error } = await supabase
    .from('ghost_sightings')
    .select('*')
    .eq('state', state)
    .order('date_of_sighting', { ascending: false });

  if (error) {
    console.error('Error fetching sightings by state:', error);
    return [];
  }

  return data as GhostSighting[];
}

// Helper function to get sightings within a bounding box
export async function getSightingsInBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
) {
  const { data, error } = await supabase
    .from('ghost_sightings')
    .select('*')
    .gte('latitude', minLat)
    .lte('latitude', maxLat)
    .gte('longitude', minLng)
    .lte('longitude', maxLng);

  if (error) {
    console.error('Error fetching sightings in bounds:', error);
    return [];
  }

  return data as GhostSighting[];
}

