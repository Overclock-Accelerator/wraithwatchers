// Shape of a row in the ghost_sightings table, as returned by the API routes.
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
