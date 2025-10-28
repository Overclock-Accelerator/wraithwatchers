'use client';

import { useState } from 'react';
import { addSighting } from '@/lib/supabase';

export default function AddSightingForm() {
  const [formData, setFormData] = useState({
    date_of_sighting: new Date().toISOString().split('T')[0],
    latitude: '',
    longitude: '',
    city: '',
    state: '',
    notes: '',
    time_of_day: 'Night',
    apparition_tag: 'Shadow Figure',
    image_link: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Validate coordinates
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates. Please enter valid numbers.');
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Coordinates out of range. Latitude: -90 to 90, Longitude: -180 to 180');
      }

      // Submit to Supabase
      await addSighting({
        date_of_sighting: formData.date_of_sighting,
        latitude: lat,
        longitude: lng,
        city: formData.city || null,
        state: formData.state || null,
        notes: formData.notes || null,
        time_of_day: formData.time_of_day || null,
        apparition_tag: formData.apparition_tag || null,
        image_link: formData.image_link || null
      });

      setSubmitStatus({
        type: 'success',
        message: 'Ghost sighting submitted successfully!'
      });

      // Reset form
      setFormData({
        date_of_sighting: new Date().toISOString().split('T')[0],
        latitude: '',
        longitude: '',
        city: '',
        state: '',
        notes: '',
        time_of_day: 'Night',
        apparition_tag: 'Shadow Figure',
        image_link: ''
      });
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
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-6">Report a Ghost Sighting</h2>
        
        {submitStatus && (
          <div className={`mb-6 p-4 rounded-lg ${
            submitStatus.type === 'success' 
              ? 'bg-green-900 border border-green-700 text-green-100'
              : 'bg-red-900 border border-red-700 text-red-100'
          }`}>
            {submitStatus.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div>
            <label htmlFor="date_of_sighting" className="block text-sm font-medium text-gray-300 mb-2">
              Date of Sighting *
            </label>
            <input
              type="date"
              id="date_of_sighting"
              name="date_of_sighting"
              value={formData.date_of_sighting}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-300 mb-2">
                Latitude *
              </label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                step="any"
                required
                placeholder="e.g., 40.7128"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-300 mb-2">
                Longitude *
              </label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                step="any"
                required
                placeholder="e.g., -74.0060"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* City & State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g., New York"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-2">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g., New York"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <label htmlFor="time_of_day" className="block text-sm font-medium text-gray-300 mb-2">
              Time of Day
            </label>
            <select
              id="time_of_day"
              name="time_of_day"
              value={formData.time_of_day}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Dawn">Dawn</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
              <option value="Midnight">Midnight</option>
            </select>
          </div>

          {/* Apparition Type */}
          <div>
            <label htmlFor="apparition_tag" className="block text-sm font-medium text-gray-300 mb-2">
              Type of Apparition
            </label>
            <select
              id="apparition_tag"
              name="apparition_tag"
              value={formData.apparition_tag}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
              Description / Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Describe what you saw..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Image Link */}
          <div>
            <label htmlFor="image_link" className="block text-sm font-medium text-gray-300 mb-2">
              Image URL (optional)
            </label>
            <input
              type="url"
              id="image_link"
              name="image_link"
              value={formData.image_link}
              onChange={handleChange}
              placeholder="https://example.com/ghost-photo.jpg"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-md transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Sighting'}
          </button>
        </form>
      </div>
    </div>
  );
}

