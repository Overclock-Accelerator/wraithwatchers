// Shared (client + server) image upload rules.
export const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Blob pathname scheme: ghost-sightings-images/<userId>/<timestamp>-<random>.<ext>.
// The prefix keeps new uploads alongside the images migrated from the old Supabase bucket
// of the same name. Only anonymous uploads exist today.
export const IMAGE_PATH_PREFIX = 'ghost-sightings-images';
export const IMAGE_PATHNAME_PATTERN = /^ghost-sightings-images\/anonymous\/\d+-[a-z0-9]+\.[^/]+$/;
