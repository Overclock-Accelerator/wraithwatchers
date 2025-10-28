'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxMap from './components/MapboxMap';
import { supabase, GhostSighting } from '@/lib/supabase';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

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

interface SightingsStatsProps {
  totalCount: number;
  mostRecentSighting: string;
  mostGhostlyCity: string;
}

function SightingsStats({ totalCount, mostRecentSighting, mostGhostlyCity }: SightingsStatsProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6">Sightings Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <div className="text-sm text-gray-400 mb-2">Total Sightings:</div>
          <div className="text-3xl font-bold">{totalCount.toLocaleString()}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <div className="text-sm text-gray-400 mb-2">Most Recent Sighting:</div>
          <div className="text-3xl font-bold">{mostRecentSighting}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <div className="text-sm text-gray-400 mb-2">Most Ghostly City:</div>
          <div className="text-3xl font-bold">{mostGhostlyCity}</div>
        </div>
      </div>
    </div>
  );
}

function SightingsTable({ sightings }: { sightings: Sighting[] }) {
  // Show only first 10 sightings in table for performance
  const displaySightings = sightings.slice(0, 10);
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Recent Sightings</h2>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium">
          Export Data
        </button>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Image</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displaySightings.map((sighting) => (
                <tr key={sighting.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{sighting.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{sighting.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{sighting.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{sighting.location}</td>
                  <td className="px-6 py-4 text-sm max-w-xs truncate">{sighting.notes}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {sighting.hasImage ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-800 text-green-100">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                        No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-800 text-center text-sm text-gray-400">
          Showing first 10 of {sightings.length} total sightings
        </div>
      </div>
    </div>
  );
}

// Convert Supabase GhostSighting to our Sighting format
function convertToSighting(dbSighting: GhostSighting): Sighting {
  return {
    id: dbSighting.id,
    date: dbSighting.date_of_sighting,
    time: dbSighting.time_of_day || 'Unknown',
    type: dbSighting.apparition_tag || 'Unknown',
    location: `${dbSighting.city || 'Unknown'}, ${dbSighting.state || 'Unknown'}`,
    lat: dbSighting.latitude,
    lng: dbSighting.longitude,
    notes: dbSighting.notes || 'No notes available',
    hasImage: !!(dbSighting.image_link && dbSighting.image_link.trim()),
    imageUrl: dbSighting.image_link
  };
}


// Helper function to calculate time ago
function getTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 Day Ago';
    if (diffDays < 30) return `${diffDays} Days Ago`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 Month Ago' : `${months} Months Ago`;
    }
    const years = Math.floor(diffDays / 365);
    return years === 1 ? '1 Year Ago' : `${years} Years Ago`;
  } catch {
    return 'Unknown';
  }
}

// Helper function to find most ghostly city
function getMostGhostlyCity(sightings: Sighting[]): string {
  if (sightings.length === 0) return 'Unknown';
  
  const cityCounts = new Map<string, number>();
  
  sightings.forEach(sighting => {
    if (sighting.location && sighting.location !== 'Unknown, Unknown') {
      const count = cityCounts.get(sighting.location) || 0;
      cityCounts.set(sighting.location, count + 1);
    }
  });
  
  if (cityCounts.size === 0) return 'Unknown';
  
  let maxCity = '';
  let maxCount = 0;
  
  cityCounts.forEach((count, city) => {
    if (count > maxCount) {
      maxCount = count;
      maxCity = city;
    }
  });
  
  return maxCity || 'Unknown';
}

export default function Home() {
  const [sightingsData, setSightingsData] = useState<Sighting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostRecentSighting, setMostRecentSighting] = useState<string>('Loading...');
  const [mostGhostlyCity, setMostGhostlyCity] = useState<string>('Loading...');

  // Load data from Supabase on component mount
  useEffect(() => {
    const loadSupabaseData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch all sightings from Supabase
        const { data, error } = await supabase
          .from('ghost_sightings')
          .select('*')
          .order('date_of_sighting', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (!data || data.length === 0) {
          throw new Error('No sightings found in database');
        }
        
        // Convert to our Sighting format
        const convertedSightings = data.map(convertToSighting);
        
        console.log(`📊 Loaded ${convertedSightings.length} sightings from Supabase`);
        setSightingsData(convertedSightings);
        
        // Calculate stats
        if (convertedSightings.length > 0) {
          // Most recent sighting (data is already sorted by date descending)
          const mostRecent = convertedSightings[0];
          setMostRecentSighting(getTimeAgo(mostRecent.date));
          
          // Most ghostly city
          setMostGhostlyCity(getMostGhostlyCity(convertedSightings));
        }
      } catch (err) {
        console.error('Error loading Supabase data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sightings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSupabaseData();

    // Optional: Subscribe to real-time updates
    const subscription = supabase
      .channel('ghost_sightings_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ghost_sightings'
        },
        (payload) => {
          console.log('New sighting added!', payload.new);
          const newSighting = convertToSighting(payload.new as GhostSighting);
          setSightingsData(prev => [newSighting, ...prev]);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">👻 Wraith Watchers</h1>
          <p className="text-gray-400">Track paranormal activity across the globe</p>
        </div>

        <SightingsStats 
          totalCount={sightingsData.length} 
          mostRecentSighting={mostRecentSighting}
          mostGhostlyCity={mostGhostlyCity}
        />
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Sightings Map</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="w-full h-96 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <div className="text-gray-300">Loading ghost sightings from database...</div>
                </div>
              </div>
            ) : error ? (
              <div className="w-full h-96 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="text-red-500 mb-4">⚠️ Error Loading Data</div>
                  <div className="text-gray-300">{error}</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Make sure your Supabase credentials are configured in .env.local
                  </div>
                </div>
              </div>
            ) : (
              <MapboxMap sightings={sightingsData} />
            )}
            <div className="p-4 bg-gray-800 text-center">
              <div className="text-sm text-gray-300">
                Powered by Mapbox GL JS & Supabase • {sightingsData.length} sightings loaded
              </div>
            </div>
          </div>
        </div>

        <SightingsTable sightings={sightingsData} />
      </div>
    </div>
  );
}