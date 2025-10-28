'use client';

import { useState, useEffect, useRef } from 'react';

interface Sighting {
  id: number | string;
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
    let mapboxgl: any = null;
    
    const loadMapboxResources = async () => {
      try {
        console.log('🗺️ Loading Mapbox GL JS...');
        
        // Dynamically import Mapbox GL JS
        mapboxgl = await import('mapbox-gl');
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
        return mapboxgl;
      } catch (error) {
        console.error('❌ Error loading Mapbox resources:', error);
        throw error;
      }
    };

    const initializeMap = async (mapboxgl: any) => {
      try {
        // Wait for container to be available
        if (map.current) {
          console.log('🚫 Map already exists, skipping initialization');
          return;
        }

        if (!mapContainer.current) {
          console.log('⏳ Container not ready, retrying in 100ms...');
          setTimeout(() => initializeMap(mapboxgl), 100);
          return;
        }

        console.log('🚀 Starting map initialization...');
        console.log('📦 Container ready:', !!mapContainer.current);

        // ========================================
        // MAPBOX TOKEN CONFIGURATION:
        // Using provided Mapbox token for afhaque account
        // ========================================
        // const HARDCODED_MAPBOX_TOKEN = 'pk.eyJ1IjoiYWZoYXF1ZSIsImEiOiJjbWZ6eHdib3UwN3lmMmtwdG9vMWN6dXNsIn0.4CcHAooT7xMtEyUFDNFWIQ';
        
        // Get token from environment or hardcoded value
        // TEMPORARY: Using hardcoded token until environment is properly set up
        const token = 'pk.eyJ1IjoiYWZoYXF1ZSIsImEiOiJjbWZ6eHdib3UwN3lmMmtwdG9vMWN6dXNsIn0.4CcHAooT7xMtEyUFDNFWIQ';
        
        console.log('🔍 Token debug:', {
          envToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
          finalToken: token,
          tokenLength: token?.length,
          startsWithPk: token?.startsWith('pk.')
        });
        
        // Validate token format
        if (!token || !token.startsWith('pk.')) {
          const errorMsg = 'Invalid or missing Mapbox token';
          console.error('❌ MAPBOX TOKEN ERROR:', errorMsg);
          console.log('📝 Expected format: pk.eyJ...');
          setError(errorMsg);
          return;
        }
        
        mapboxgl.default.accessToken = token;
        console.log('🔑 Mapbox token set:', token.substring(0, 20) + '...');
        console.log('🔑 Token length:', token.length);
        console.log('🗺️ Initializing map...');
        console.log('📍 Container element:', mapContainer.current);
        console.log('📦 Mapbox GL loaded');

        // Initialize map
        try {
          map.current = new mapboxgl.default.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-98.5795, 39.8283], // Center of US
            zoom: 4
          });
          
          console.log('✅ Map object created successfully');
          console.log('🗺️ Map initialized, waiting for load event...');
        } catch (mapError) {
          console.error('❌ Failed to create map object:', mapError);
          setError(`Map initialization failed: ${mapError instanceof Error ? mapError.message : 'Unknown error'}`);
          return;
        }

        // Set up a timeout to detect if map never loads
        const loadTimeout = setTimeout(() => {
          console.error('⏰ Map load timeout - map failed to load within 10 seconds');
          setError('Map loading timed out - check network connection and token');
        }, 10000);

        // Add style loading events
        map.current.on('styledata', (e: any) => {
          console.log('🎨 Style loading event:', e.dataType);
        });

        map.current.on('load', () => {
          clearTimeout(loadTimeout);
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

          // Add unclustered points layer with ghost-themed styling
          map.current.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'sightings',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#e5e7eb', // Ghost white/light gray
              'circle-radius': 8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#9ca3af', // Darker gray border
              'circle-opacity': 0.9
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

        map.current.on('error', (e: any) => {
          console.error('❌ Mapbox map error:', e);
          if (e.error && e.error.message) {
            console.error('❌ Error details:', e.error.message);
            if (e.error.message.includes('Unauthorized') || e.error.message.includes('token')) {
              setError('Token authentication failed - check token validity');
            } else if (e.error.message.includes('style') || e.error.message.includes('tiles')) {
              setError('Map style loading failed - check network connection');
            }
          } else {
            setError('Map loading failed - see console for details');
          }
        });

        // Add style loading error handler
        map.current.on('styleimagemissing', (e: any) => {
          console.warn('⚠️ Style image missing:', e.id);
        });

        map.current.on('sourcedata', (e: any) => {
          if (e.isSourceLoaded) {
            console.log('✅ Map source loaded:', e.sourceId);
          }
        });

      } catch (error) {
        console.error('❌ Error initializing map:', error);
        setMapboxLoaded(false);
        setError(error instanceof Error ? error.message : 'Unknown error initializing map');
      }
    };

    // Start the process
    const startMapboxInitialization = async () => {
      try {
        const mapboxgl = await loadMapboxResources();
        await initializeMap(mapboxgl);
      } catch (error) {
        console.error('❌ Error loading Mapbox:', error);
        setMapboxLoaded(false);
        setError(error instanceof Error ? error.message : 'Unknown error loading Mapbox');
      }
    };

    startMapboxInitialization();

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
