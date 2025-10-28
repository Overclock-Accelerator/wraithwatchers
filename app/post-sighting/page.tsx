'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function PostSighting() {
  const router = useRouter();
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

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current || map) return;

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
  }, [map]);

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
        message: '✨ Ghost sighting submitted successfully! Redirecting to map...'
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

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push('/');
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Post a Sighting</h1>
          <p className="text-gray-400">
            Did you spot a spirit? Post information below so that our community can stand vigilant!
          </p>
        </div>
        
        {submitStatus && (
          <div className={`mb-6 p-4 rounded-lg ${
            submitStatus.type === 'success' 
              ? 'bg-green-900 border border-green-700 text-green-100'
              : 'bg-red-900 border border-red-700 text-red-100'
          }`}>
            <p className="text-sm">{submitStatus.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
          {/* Date of Sighting */}
          <div>
            <label htmlFor="date_of_sighting" className="block text-sm font-medium text-gray-300 mb-2">
              Date of Sighting
            </label>
            <input
              type="date"
              id="date_of_sighting"
              name="date_of_sighting"
              value={formData.date_of_sighting}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Time of Sighting */}
          <div>
            <label htmlFor="time_of_day" className="block text-sm font-medium text-gray-300 mb-2">
              Time of Sighting
            </label>
            <select
              id="time_of_day"
              name="time_of_day"
              value={formData.time_of_day}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
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
            <label htmlFor="apparition_tag" className="block text-sm font-medium text-gray-300 mb-2">
              Type of Sighting
            </label>
            <select
              id="apparition_tag"
              name="apparition_tag"
              value={formData.apparition_tag}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-orange-500"
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
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
              Sighting Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Describe what you experienced..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* Map Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Where Were You Exactly? (Place a Pin)
            </label>
            <div 
              ref={mapContainerRef}
              className="w-full h-96 border border-gray-700 rounded"
            />
            {formData.latitude && formData.longitude && (
              <p className="text-xs text-gray-400 mt-2">
                📍 Selected: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                <span className="block text-gray-500 mt-1">You can drag the pin to adjust the location</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded transition-colors"
          >
            {isSubmitting ? 'Posting...' : 'Post Your Sighting'}
          </button>
        </form>
      </div>
    </div>
  );
}

