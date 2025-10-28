# Supabase Integration Examples

Example components showing how to use Supabase with your ghost sightings app.

## Files

**`page-with-supabase.tsx`** - Drop-in replacement for `app/page.tsx`
- Fetches from Supabase instead of CSV
- Real-time updates
- Error handling & loading states

**`add-sighting-form.tsx`** - Form for submitting new sightings
- Validation & error messages
- All fields supported
- Auto-reset after submission

## Using the Examples

### Replace Your Page Component

Copy `page-with-supabase.tsx` to `app/page.tsx`:
```bash
cp examples/page-with-supabase.tsx app/page.tsx
```

### Add Submission Form

Create `app/submit/page.tsx`:
```tsx
import AddSightingForm from '@/examples/add-sighting-form';

export default function SubmitPage() {
  return <AddSightingForm />;
}
```

## Common Queries

### Get Recent Sightings
```tsx
const { data } = await supabase
  .from('ghost_sightings')
  .select('*')
  .order('date_of_sighting', { ascending: false })
  .limit(50);
```

### Filter by State
```tsx
const { data } = await supabase
  .from('ghost_sightings')
  .select('*')
  .eq('state', 'California');
```

### Filter by Type
```tsx
const { data } = await supabase
  .from('ghost_sightings')
  .select('*')
  .eq('apparition_tag', 'Shadow Figure');
```

### Search Notes
```tsx
const { data } = await supabase
  .from('ghost_sightings')
  .select('*')
  .ilike('notes', '%cemetery%');
```

### Get Sightings in Map Bounds
```tsx
const { data } = await supabase
  .from('ghost_sightings')
  .select('*')
  .gte('latitude', minLat)
  .lte('latitude', maxLat)
  .gte('longitude', minLng)
  .lte('longitude', maxLng);
```

See `SUPABASE_MIGRATION.md` for setup instructions.

