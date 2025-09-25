'use client';

import { useState, useEffect, useRef } from 'react';

interface Sighting {
  id: number;
  date: string;
  time: string;
  type: string;
  location: string;
  lat: number;
  lng: number;
  notes: string;
  hasImage: boolean;
  imageUrl?: string | null;
}

interface MapboxMapProps {
  sightings: Sighting[];
}

export default function MapboxMap({ sightings }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [selectedSighting, setSelectedSighting] = useState<Sighting | null>(null);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Mapbox GL JS dynamically
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        console.log('🗺️ Loading Mapbox GL JS...');
        
        // Dynamically import Mapbox GL JS
        const mapboxgl = await import('mapbox-gl');
        console.log('✅ Mapbox GL JS loaded successfully');
        
        // Import CSS dynamically and wait for it to load
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css';
        
        // Wait for CSS to load
        await new Promise((resolve, reject) => {
          link.onload = () => {
            console.log('✅ Mapbox CSS loaded successfully');
            resolve(undefined);
          };
          link.onerror = () => {
            console.error('❌ Failed to load Mapbox CSS');
            reject(new Error('Failed to load Mapbox CSS'));
          };
          document.head.appendChild(link);
        });
        
        setMapboxLoaded(true);
        
        if (map.current || !mapContainer.current) return;

        // ========================================
        // MAPBOX TOKEN CONFIGURATION:
        // Using provided Mapbox token for afhaque account
        // ========================================
        const HARDCODED_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWZoYXF1ZSIsImEiOiJjbWZ6eHdib3UwN3lmMmtwdG9vMWN6dXNsIn0.4CcHAooT7xMtEyUFDNFWIQ';
        
        // Get token from environment or hardcoded value
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || HARDCODED_MAPBOX_TOKEN;
        
        // Validate token format
        if (!token || !token.startsWith('pk.')) {
          const errorMsg = 'Invalid or missing Mapbox token';
          console.error('❌ MAPBOX TOKEN ERROR:', errorMsg);
          console.log('📝 Expected format: pk.eyJ...');
          setError(errorMsg);
          return;
        }
        
        mapboxgl.default.accessToken = token;
        console.log('🔑 Mapbox token set, initializing map...');

        // Initialize map
        map.current = new mapboxgl.default.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-98.5795, 39.8283], // Center of US
          zoom: 4
        });
        
        console.log('🗺️ Map initialized, waiting for load event...');

        map.current.on('load', () => {
          console.log('✅ Map loaded successfully, adding data layers...');
          // Create GeoJSON data for clustering
          const geojsonData = {
            type: 'FeatureCollection',
            features: sightings.map((sighting) => ({
              type: 'Feature',
              properties: {
                id: sighting.id,
                type: sighting.type,
                location: sighting.location,
                date: sighting.date,
                time: sighting.time,
                notes: sighting.notes,
                hasImage: sighting.hasImage,
                imageUrl: sighting.imageUrl
              },
              geometry: {
                type: 'Point',
                coordinates: [sighting.lng, sighting.lat]
              }
            }))
          };

          // Add source
          map.current.addSource('sightings', {
            type: 'geojson',
            data: geojsonData,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
          });

          // Add cluster layer
          map.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'sightings',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#f97316', // orange for small clusters
                100,
                '#ea580c', // darker orange for medium clusters
                750,
                '#c2410c'  // darkest orange for large clusters
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                20,
                100,
                30,
                750,
                40
              ]
            }
          });

          // Add cluster count layer
          map.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'sightings',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12
            },
            paint: {
              'text-color': '#ffffff'
            }
          });

          // Add unclustered points layer
          map.current.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'sightings',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#f97316',
              'circle-radius': 8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff'
            }
          });

          // Handle cluster clicks
          map.current.on('click', 'clusters', (e: any) => {
            const features = map.current.queryRenderedFeatures(e.point, {
              layers: ['clusters']
            });

            const clusterId = features[0].properties.cluster_id;
            map.current.getSource('sightings').getClusterExpansionZoom(
              clusterId,
              (err: any, zoom: number) => {
                if (err) return;

                map.current.easeTo({
                  center: features[0].geometry.coordinates,
                  zoom: zoom
                });
              }
            );
          });

          // Handle individual marker clicks
          map.current.on('click', 'unclustered-point', (e: any) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;
            
            // Find the full sighting data
            const sighting = sightings.find(s => s.id === properties.id);
            if (sighting) {
              setSelectedSighting(sighting);
              
              // Create popup
              const popup = new mapboxgl.default.Popup({ offset: 25 })
                .setLngLat(coordinates)
                .setHTML(`
                  <div class="p-4 max-w-sm">
                    <h3 class="font-bold text-lg mb-2 text-gray-900">${sighting.type}</h3>
                    <div class="space-y-2 text-sm text-gray-700">
                      <p><strong>Location:</strong> ${sighting.location}</p>
                      <p><strong>Date:</strong> ${sighting.date}</p>
                      <p><strong>Time:</strong> ${sighting.time}</p>
                      <p><strong>Notes:</strong> ${sighting.notes}</p>
                      ${sighting.hasImage && sighting.imageUrl ? 
                        `<img src="${sighting.imageUrl}" alt="Sighting evidence" class="w-full h-32 object-cover rounded mt-2" onerror="this.style.display='none'">` : 
                        ''}
                    </div>
                  </div>
                `)
                .addTo(map.current);
            }
          });

          // Change cursor on hover
          map.current.on('mouseenter', 'clusters', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });
          map.current.on('mouseleave', 'clusters', () => {
            map.current.getCanvas().style.cursor = '';
          });
          map.current.on('mouseenter', 'unclustered-point', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });
          map.current.on('mouseleave', 'unclustered-point', () => {
            map.current.getCanvas().style.cursor = '';
          });
        });

      } catch (error) {
        console.error('❌ Error loading Mapbox:', error);
        setMapboxLoaded(false);
        setError(error instanceof Error ? error.message : 'Unknown error loading Mapbox');
      }
    };

    loadMapbox();

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [sightings]);

  // Error state
  if (error) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-center p-8">
          <div className="text-red-400 text-lg font-semibold mb-4">❌ Mapbox Error</div>
          <div className="text-gray-300 text-sm mb-4">{error}</div>
          <div className="text-gray-400 text-xs">Check console for detailed instructions</div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!mapboxLoaded) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <div className="text-gray-300 mb-2">Loading Mapbox GL JS...</div>
          <div className="text-gray-500 text-xs">
            Check console for detailed loading progress
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px]">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-sm z-10">
        <div className="font-bold mb-1">Ghost Sightings Map</div>
        <div className="text-xs text-gray-300">
          {sightings.length} total sightings • Click clusters to zoom • Click markers for details
        </div>
      </div>
    </div>
  );
}
