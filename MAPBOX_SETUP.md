# 🗺️ Mapbox Setup & Troubleshooting Guide

## 🚀 Quick Setup

### 1. Get Your Mapbox Token
1. Go to [Mapbox](https://www.mapbox.com/) and create a free account
2. Navigate to your [Access Tokens page](https://account.mapbox.com/access-tokens/)
3. Copy your **Default Public Token** or create a new one

### 2. Configure Token (Choose One Method)

**Method A: Environment Variable (Recommended)**
Create a `.env.local` file in your project root:
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_actual_token_here
```

**Method B: Direct Code Edit**
- Open `app/components/MapboxMap.tsx`
- Replace `YOUR_MAPBOX_TOKEN_HERE` with your actual token

## 🔧 Troubleshooting Common Issues

### ❌ Map Not Loading

**Check Console Messages**
Open browser console (F12) and look for:
- 🗺️ Loading progress indicators
- ✅ Success confirmations
- ❌ Error messages with solutions

**Common Error Messages & Fixes:**

1. **"Please set a valid Mapbox token"**
   - Your token is still set to placeholder
   - Follow setup steps above

2. **401 Unauthorized**
   - Invalid or expired token
   - Generate new token from Mapbox dashboard

3. **Network/CORS errors**
   - Check internet connection
   - Verify token permissions

### 🔍 Debug Information

The app provides detailed logging:
```
🗺️ Loading Mapbox GL JS...
✅ Mapbox GL JS loaded successfully
✅ Mapbox CSS loaded successfully
🔑 Mapbox token set, initializing map...
🗺️ Map initialized, waiting for load event...
✅ Map loaded successfully, adding data layers...
```

### 📊 Data Issues

**CSV Loading Problems:**
- File should be at `/public/data/ghost_sightings_12000_with_images.csv`
- Check console for coordinate validation messages
- Invalid coordinates are automatically filtered out

## Features Implemented

- **Mapbox GL JS**: Modern, performant mapping library
- **Marker Clustering**: Automatically groups nearby markers for better performance
- **Interactive Clusters**: Click clusters to zoom in and expand
- **Clickable Markers**: Individual markers show detailed popups
- **Dark Theme**: Matches your app's aesthetic
- **Large Dataset Support**: Handles 12,000+ markers efficiently

## Map Controls

- **Cluster Interaction**: Click orange clusters to zoom in
- **Marker Details**: Click individual markers to see sighting details
- **Pan & Zoom**: Standard map navigation
- **Responsive Design**: Works on desktop and mobile

## Data Validation

The new implementation includes better coordinate validation:
- Filters out invalid coordinates (NaN values)
- Validates US geographic bounds (lat: 24-50, lng: -125 to -66)
- Provides detailed console logging for debugging

## Performance Improvements

- Uses WebGL rendering for smooth performance
- Efficient clustering algorithm
- Lazy loading of map tiles
- Optimized for large datasets
