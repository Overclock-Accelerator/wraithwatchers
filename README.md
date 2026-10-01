# 👻 Wraith Watchers

A Next.js application for tracking and visualizing paranormal activity across the globe. Users can report ghost sightings with photos, view them on an interactive map, and explore the growing database of supernatural encounters.

## Features

- 🗺️ **Interactive Map**: Visualize ghost sightings using Mapbox GL JS with clustering
- 📸 **Image Uploads**: Upload photos as evidence of paranormal activity
- 📊 **Live Data**: New sightings show up automatically (polled every 15s)
- 🌙 **Dark Theme**: Spooky dark UI perfect for ghost hunting
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Neon (PostgreSQL), queried server-side only
- **Storage**: Vercel Blob
- **Maps**: Mapbox GL JS
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Neon database and a Vercel Blob store
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
# Neon Postgres (server-only)
NEON_DATABASE_URL=your-neon-connection-string

# Vercel Blob (server-only)
BLOB_READ_WRITE_TOKEN=your-blob-read-write-token

# Mapbox (from https://account.mapbox.com)
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

### 3. Database Setup

The app expects a `ghost_sightings` table (uuid `id`, `date_of_sighting` date, `latitude`/`longitude`
numeric, `city`, `state`, `notes`, `time_of_day`, `apparition_tag`, `image_link`, `created_at`, `updated_at`)
in the Neon database.

### 4. Storage Setup

Images are stored in Vercel Blob with public access under `ghost-sightings-images/anonymous/<timestamp>-<random>.<ext>`.
Connect a Blob store to the Vercel project so `BLOB_READ_WRITE_TOKEN` is set.

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
- Stored in Vercel Blob (uploaded directly from the browser with a short-lived token from `/api/images/upload`)

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
│   ├── db.ts                # Neon client & query helpers (server-only)
│   ├── storage.ts           # Vercel Blob delete/list helpers (server-only)
│   ├── upload-image.ts      # Browser-side image upload
│   └── types.ts             # GhostSighting type
├── public/data/             # CSV data files
└── scripts/                 # Migration scripts
```

## Documentation

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
- `IMAGE_UPLOAD_README.md` for upload problems
- Browser console for detailed error messages

---

Built with 👻 by paranormal enthusiasts
