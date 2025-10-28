'use client';

import { useState, useEffect, useRef } from 'react';
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

function SightingsStats({ totalCount }: { totalCount: number }) {
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
          <div className="text-3xl font-bold">2 Days Ago</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <div className="text-sm text-gray-400 mb-2">Most Ghostly City:</div>
          <div className="text-3xl font-bold">Albuquerque, NM</div>
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

function AddSightingModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [formData, setFormData] = useState({
    date_of_sighting: new Date().toISOString().split('T')[0],
    latitude: null as number | null,
    longitude: null as number | null,
    city: '',
    state: '',
    notes: '',
    time_of_day: 'Night',
    apparition_tag: 'Shadow Figure',
    image_link: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);

  // Initialize map when modal opens
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;
    if (map) return; // Map already initialized

    const newMap = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 3
    });

    let currentMarker: mapboxgl.Marker | null = null;

    newMap.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));

      // Remove existing marker if any
      if (currentMarker) {
        currentMarker.remove();
      }

      // Add new marker
      const newMarker = new mapboxgl.Marker({
        color: '#f97316', // Orange color
        draggable: true
      })
        .setLngLat([lng, lat])
        .addTo(newMap);

      // Update coordinates when marker is dragged
      newMarker.on('dragend', () => {
        const lngLat = newMarker.getLngLat();
        setFormData(prev => ({
          ...prev,
          latitude: lngLat.lat,
          longitude: lngLat.lng
        }));
      });

      currentMarker = newMarker;
      setMarker(newMarker);
    });

    setMap(newMap);

    return () => {
      if (currentMarker) {
        currentMarker.remove();
      }
      newMap.remove();
    };
  }, [isOpen, map]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (marker) {
        marker.remove();
        setMarker(null);
      }
      if (map) {
        map.remove();
        setMap(null);
      }
    }
  }, [isOpen, map, marker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Validate that location is selected
      if (formData.latitude === null || formData.longitude === null) {
        throw new Error('Please select a location on the map by clicking where the sighting occurred');
      }

      // Submit to API route
      const response = await fetch('/api/sightings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit sighting');
      }

      setSubmitStatus({
        type: 'success',
        message: '✨ Ghost sighting submitted successfully! It will appear on the map shortly.'
      });

      // Reset form
      setFormData({
        date_of_sighting: new Date().toISOString().split('T')[0],
        latitude: null,
        longitude: null,
        city: '',
        state: '',
        notes: '',
        time_of_day: 'Night',
        apparition_tag: 'Shadow Figure',
        image_link: ''
      });

      // Remove marker
      if (marker) {
        marker.remove();
        setMarker(null);
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSubmitStatus(null);
      }, 2000);

    } catch (error) {
      console.error('Error submitting sighting:', error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit sighting'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white text-black rounded-lg max-w-md w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Post a Sighting</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        {/* Description */}
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm text-gray-700 text-center">
            Did you spot a spirit? Post information below so that our community can stand vigilant!
          </p>
        </div>
        
        {submitStatus && (
          <div className={`mx-6 mt-4 p-3 rounded ${
            submitStatus.type === 'success' 
              ? 'bg-green-100 border border-green-300 text-green-800'
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
            <p className="text-sm">{submitStatus.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Date of Sighting */}
          <div>
            <label htmlFor="date_of_sighting" className="block text-sm font-medium text-gray-900 mb-2">
              Date of Sighting
            </label>
            <input
              type="date"
              id="date_of_sighting"
              name="date_of_sighting"
              value={formData.date_of_sighting}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded text-gray-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Time of Sighting */}
          <div>
            <label htmlFor="time_of_day" className="block text-sm font-medium text-gray-900 mb-2">
              Time of Sighting
            </label>
            <select
              id="time_of_day"
              name="time_of_day"
              value={formData.time_of_day}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded text-gray-900 focus:outline-none focus:border-orange-500"
            >
              <option value="Dawn">Dawn</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
              <option value="Midnight">Midnight</option>
            </select>
          </div>

          {/* Type of Sighting */}
          <div>
            <label htmlFor="apparition_tag" className="block text-sm font-medium text-gray-900 mb-2">
              Type of Sighting
            </label>
            <select
              id="apparition_tag"
              name="apparition_tag"
              value={formData.apparition_tag}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded text-gray-900 focus:outline-none focus:border-orange-500"
            >
              <option value="Shadow Figure">Shadow Figure</option>
              <option value="Orbs">Orbs</option>
              <option value="Poltergeist">Poltergeist</option>
              <option value="Headless Spirit">Headless Spirit</option>
              <option value="Full Apparition">Full Apparition</option>
              <option value="Partial Apparition">Partial Apparition</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Sighting Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-2">
              Sighting Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Describe what you experienced..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded text-gray-900 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* Map Section */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Where Were You Exactly? (Place a Pin)
            </label>
            <div 
              ref={mapContainerRef}
              className="w-full h-64 border-2 border-gray-300 rounded"
            />
            {formData.latitude && formData.longitude && (
              <p className="text-xs text-gray-600 mt-2">
                📍 Selected: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                <span className="block text-gray-500 mt-1">You can drag the pin to adjust the location</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded transition-colors"
          >
            {isSubmitting ? 'Posting...' : 'Post Your Sighting'}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-gray-900 text-white px-6 py-3 text-center">
          <p className="text-xs text-gray-400">Footer</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [sightingsData, setSightingsData] = useState<Sighting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        {/* Header with Post Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">👻 Wraith Watchers</h1>
            <p className="text-gray-400">Track paranormal activity across the globe</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Post a Sighting
          </button>
        </div>

        <SightingsStats totalCount={sightingsData.length} />
        
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

        {/* Add Sighting Modal */}
        <AddSightingModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </div>
  );
}