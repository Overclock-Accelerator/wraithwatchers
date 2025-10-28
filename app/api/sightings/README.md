# Ghost Sightings API

Server-side API routes for managing ghost sightings.

## Endpoints

### POST /api/sightings
Add a new ghost sighting to the database.

**Request Body:**
```json
{
  "date_of_sighting": "2025-10-28",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "city": "New York",
  "state": "New York",
  "notes": "Saw a ghostly figure...",
  "time_of_day": "Night",
  "apparition_tag": "Shadow Figure",
  "image_link": "https://example.com/image.jpg"
}
```

**Required Fields:**
- `date_of_sighting` (string, ISO date format)
- `latitude` (number, -90 to 90)
- `longitude` (number, -180 to 180)

**Optional Fields:**
- `city` (string)
- `state` (string)
- `notes` (string)
- `time_of_day` (string)
- `apparition_tag` (string)
- `image_link` (string, URL)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "date_of_sighting": "2025-10-28",
    "latitude": 40.7128,
    "longitude": -74.0060,
    ...
  }
}
```

**Error Response (400/500):**
```json
{
  "error": "Error message",
  "details": "Additional details..."
}
```

---

### GET /api/sightings
Fetch ghost sightings from the database.

**Query Parameters:**
- `limit` (optional, default: 100) - Maximum number of sightings to return
- `state` (optional) - Filter by state

**Examples:**
```
GET /api/sightings
GET /api/sightings?limit=50
GET /api/sightings?state=California
GET /api/sightings?limit=10&state=New York
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "date_of_sighting": "2025-10-28",
      "latitude": 40.7128,
      "longitude": -74.0060,
      ...
    }
  ]
}
```

---

## Security

- Uses Supabase service role key for server-side operations
- Validates all input data before database insertion
- Coordinates are validated to be within valid ranges
- All errors are properly logged and handled

---

## Real-time Updates

When a new sighting is added via the API, it will automatically appear in the UI thanks to Supabase real-time subscriptions (configured in `app/page.tsx`).

