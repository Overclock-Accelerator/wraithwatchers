'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { uploadSightingImage } from '@/lib/storage';

// Set Mapbox token at module level
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
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize map when component mounts
  useEffect(() => {
    if (mapRef.current) {
      console.log('Map already initialized');
      return;
    }

    // Check if token is available
    if (!mapboxgl.accessToken) {
      console.error('❌ Mapbox token not configured');
      setMapError('Mapbox token not configured. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file.');
      return;
    }

    // Wait for container to be ready
    const initMap = () => {
      if (!mapContainerRef.current) {
        console.log('⏳ Container not ready, retrying...');
        setTimeout(initMap, 100);
        return;
      }

      console.log('🗺️ Initializing post-sighting map...');
      console.log('📦 Container:', mapContainerRef.current);
      console.log('🔑 Token available:', !!mapboxgl.accessToken);

      try {
        const newMap = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-98.5795, 39.8283], // Center of USA
          zoom: 3
        });

        console.log('✅ Map created successfully');

        newMap.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          
          console.log('📍 Map clicked:', lat, lng);
          
          // Update form data
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));

          // Remove existing marker if any
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Add new marker
          const newMarker = new mapboxgl.Marker({
            color: '#f97316', // Orange color
            draggable: true
          })
            .setLngLat([lng, lat])
            .addTo(newMap);

          console.log('✅ Marker added');

          // Update coordinates when marker is dragged
          newMarker.on('dragend', () => {
            const lngLat = newMarker.getLngLat();
            console.log('🔄 Marker dragged to:', lngLat.lat, lngLat.lng);
            setFormData(prev => ({
              ...prev,
              latitude: lngLat.lat,
              longitude: lngLat.lng
            }));
          });

          markerRef.current = newMarker;
        });

        mapRef.current = newMap;
      } catch (error) {
        console.error('❌ Error initializing map:', error);
        setMapError('Failed to initialize map. Please check your Mapbox configuration.');
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initMap, 100);

    return () => {
      clearTimeout(timer);
      // Cleanup on unmount
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (mapRef.current) {
        console.log('🧹 Cleaning up map...');
        mapRef.current.remove();
      }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setSubmitStatus({
        type: 'error',
        message: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setSubmitStatus({
        type: 'error',
        message: 'File too large. Maximum size is 5MB.'
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_link: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Validate that location is selected
      if (formData.latitude === null || formData.longitude === null) {
        throw new Error('Please select a location on the map by clicking where the sighting occurred');
      }

      let imageUrl = formData.image_link;

      // Upload image if one is selected
      if (selectedFile) {
        setIsUploadingImage(true);
        setSubmitStatus({
          type: 'success',
          message: '📤 Uploading image...'
        });
        
        try {
          imageUrl = await uploadSightingImage(selectedFile);
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          throw new Error(uploadError instanceof Error ? uploadError.message : 'Failed to upload image');
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Submit to API route
      setSubmitStatus({
        type: 'success',
        message: '📝 Saving sighting...'
      });

      const response = await fetch('/api/sightings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          image_link: imageUrl
        })
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

      // Reset image state
      setSelectedFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Remove marker
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
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
      setIsUploadingImage(false);
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

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Photo (Optional)
            </label>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-64 object-cover rounded border border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                    title="Remove image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-700 rounded p-6 text-center hover:border-gray-600 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400 mb-1">Click to upload an image</p>
                      <p className="text-xs text-gray-500">JPEG, PNG, GIF, or WebP (Max 5MB)</p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Map Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Where Were You Exactly? (Place a Pin)
            </label>
            {mapError ? (
              <div className="w-full h-96 border border-gray-700 rounded bg-gray-800 flex items-center justify-center">
                <div className="text-center p-6">
                  <p className="text-red-400 mb-2">⚠️ Map Error</p>
                  <p className="text-sm text-gray-400">{mapError}</p>
                  <p className="text-xs text-gray-500 mt-4">
                    Copy <code className="bg-gray-700 px-2 py-1 rounded">env.template</code> to <code className="bg-gray-700 px-2 py-1 rounded">.env.local</code> and add your Mapbox token
                  </p>
                </div>
              </div>
            ) : (
              <div 
                ref={mapContainerRef}
                className="w-full h-96 border border-gray-700 rounded"
                style={{ minHeight: '384px' }}
              />
            )}
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
            disabled={isSubmitting || isUploadingImage}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded transition-colors"
          >
            {isUploadingImage ? 'Uploading Image...' : isSubmitting ? 'Posting...' : 'Post Your Sighting'}
          </button>
        </form>
      </div>
    </div>
  );
}

