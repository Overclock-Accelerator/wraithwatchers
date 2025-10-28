# 👻 Wraith Watchers

A Next.js application for tracking and visualizing paranormal activity across the globe. Users can report ghost sightings with photos, view them on an interactive map, and explore the growing database of supernatural encounters.

## Features

- 🗺️ **Interactive Map**: Visualize ghost sightings using Mapbox GL JS with clustering
- 📸 **Image Uploads**: Upload photos as evidence of paranormal activity
- 📊 **Real-time Data**: Powered by Supabase for instant updates
- 🌙 **Dark Theme**: Spooky dark UI perfect for ghost hunting
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Maps**: Mapbox GL JS
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Mapbox account

### 1. Clone and Install

```bash
git clone <repository-url>
cd wraithwatchers
npm install
```

### 2. Environment Setup

Copy the environment template:

```bash
cp env.template .env.local
```

Fill in your credentials in `.env.local`:

```bash
# Supabase (from https://app.supabase.com)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mapbox (from https://account.mapbox.com)
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

### 3. Database Setup

Follow the instructions in `SUPABASE_MIGRATION.md` to:
- Create the `ghost_sightings` table
- Set up proper columns and indexes

### 4. Storage Setup

Follow the instructions in `SUPABASE_STORAGE_SETUP.md` to:
- Create the `ghost-sightings-images` storage bucket
- Configure storage policies for uploads

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## New Feature: Image Uploads 📸

Users can now upload photos when posting ghost sightings!

**Features:**
- Drag & drop or click to upload
- Image preview before submission
- Supports JPEG, PNG, GIF, WebP (max 5MB)
- Images appear in map popups
- Stored securely in Supabase Storage

**Setup:** See `IMAGE_UPLOAD_README.md` for detailed instructions.

## Project Structure

```
wraithwatchers/
├── app/
│   ├── api/sightings/        # API routes for sightings
│   ├── components/           # React components
│   │   ├── MapboxMap.tsx    # Map component with clustering
│   │   ├── Navbar.tsx       # Navigation
│   │   └── Footer.tsx       # Footer
│   ├── post-sighting/       # Form to post new sightings
│   ├── page.tsx             # Home page with map
│   └── layout.tsx           # Root layout
├── lib/
│   ├── supabase.ts          # Supabase client & helpers
│   └── storage.ts           # Storage upload utilities
├── public/data/             # CSV data files
└── scripts/                 # Migration scripts
```

## Documentation

- `SUPABASE_MIGRATION.md` - Database setup
- `SUPABASE_STORAGE_SETUP.md` - Storage bucket configuration
- `IMAGE_UPLOAD_README.md` - Image upload feature guide
- `MAPBOX_SETUP.md` - Mapbox integration
- `FORM_UPDATE.md` - Form development notes

## Usage

### Viewing Sightings

1. Open the home page to see the map
2. Click clusters to zoom in
3. Click individual markers to see details and photos

### Posting a Sighting

1. Click "Post a Sighting" in the navigation
2. Fill out the form with date, time, type, and notes
3. Click the map to place a pin at the location
4. (Optional) Upload a photo as evidence
5. Submit the form

### API Endpoints

- `GET /api/sightings` - Fetch all sightings
- `POST /api/sightings` - Create a new sighting

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

## Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables
4. Deploy!

Make sure to add all environment variables from `.env.local` to Vercel's environment settings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own paranormal investigations!

## Support

Having issues? Check these resources:
- `SUPABASE_MIGRATION.md` for database setup
- `SUPABASE_STORAGE_SETUP.md` for storage issues
- `IMAGE_UPLOAD_README.md` for upload problems
- Browser console for detailed error messages

---

Built with 👻 by paranormal enthusiasts
