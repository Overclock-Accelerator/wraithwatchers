# Supabase Migration Guide

Move your CSV data (12,000+ ghost sightings) to Supabase for faster performance, public read access, and easy data additions.

## Quick Start (3 Steps)

### 1. Get Supabase Credentials (2 min)
1. Go to https://app.supabase.com and create a project
2. Navigate to **Settings → API**
3. Copy these 3 values:
   - **Project URL**
   - **anon/public key**
   - **service_role key**

### 2. Create `.env.local` (1 min)
```bash
cp env.template .env.local
```

Edit `.env.local` and add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Run Migration (2 min)
```bash
npm run migrate
```

**First time:** Script shows SQL to run in Supabase SQL Editor
**After running SQL:** Run `npm run migrate` again to import data

---

## What You Get

| Feature | CSV File | Supabase |
|---------|----------|----------|
| Load Time | 3-5 seconds | 100-300ms |
| File Size | 12 MB | Few KB |
| Add Data | Manual editing | API call |
| Real-time | Not possible | Built-in |
| Search/Filter | Client-side | Server-side |

**Security:**
- ✅ Public read access (anyone can view)
- 🔐 Authenticated write (only logged-in users can add/edit)

---

## Using Supabase in Your App

### Fetch All Sightings
```tsx
import { getAllSightings } from '@/lib/supabase';

const sightings = await getAllSightings();
```

### Add New Sighting
```tsx
import { addSighting } from '@/lib/supabase';

await addSighting({
  date_of_sighting: '2025-10-28',
  latitude: 40.7128,
  longitude: -74.0060,
  city: 'New York',
  state: 'New York',
  notes: 'Saw a ghostly figure...',
  time_of_day: 'Night',
  apparition_tag: 'Shadow Figure',
  image_link: null
});
```

### Filter by State
```tsx
import { getSightingsByState } from '@/lib/supabase';

const caSightings = await getSightingsByState('California');
```

### Real-Time Updates
```tsx
const subscription = supabase
  .channel('sightings')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'ghost_sightings' },
    (payload) => console.log('New sighting!', payload.new)
  )
  .subscribe();
```

See `examples/` folder for complete implementations.

---

## Database Schema

```sql
ghost_sightings
├── id (UUID, Primary Key)
├── date_of_sighting (DATE)
├── latitude (DECIMAL)
├── longitude (DECIMAL)
├── city (VARCHAR)
├── state (VARCHAR)
├── notes (TEXT)
├── time_of_day (VARCHAR)
├── apparition_tag (VARCHAR)
├── image_link (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## Allow Anonymous Submissions (Optional)

By default, only authenticated users can add sightings. To allow anyone to submit:

Run this in Supabase SQL Editor:
```sql
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ghost_sightings;
CREATE POLICY "Enable insert for all users" ON ghost_sightings
  FOR INSERT WITH CHECK (true);
```

---

## Troubleshooting

**"Missing Supabase credentials"**
- Ensure `.env.local` exists and has all 3 variables
- Restart your dev server

**"Table already exists"**
- Safe to run multiple times
- Won't duplicate data
- To reset: drop table in Supabase first

**Migration shows SQL every time**
- You need to run the SQL in Supabase SQL Editor first
- After running SQL, run `npm run migrate` again

---

## Next Steps

1. **Replace CSV loading** - See `examples/page-with-supabase.tsx`
2. **Add submission form** - See `examples/add-sighting-form.tsx`
3. **Enable real-time** - Subscribe to new sightings
4. **Add authentication** - Track who submits what
5. **Image storage** - Use Supabase Storage for uploads

Check `examples/README.md` for integration details.

---

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [JS Client Reference](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time](https://supabase.com/docs/guides/realtime)

