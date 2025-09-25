'use client';

import { useState, useEffect } from 'react';
import MapboxMap from './components/MapboxMap';

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

// CSV parsing function
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function SightingsStats() {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6">Sightings Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <div className="text-sm text-gray-400 mb-2">Total Sightings:</div>
          <div className="text-3xl font-bold">12,012</div>
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

// MapboxMap component is now in ./components/MapboxMap.tsx

// Test data fallback
const testSightings: Sighting[] = [
  {
    id: 1,
    date: '2024-12-13',
    time: 'Morning',
    type: 'Headless Spirit',
    location: 'San Antonio, Texas',
    lat: 29.420517,
    lng: -98.571016,
    notes: 'Electronic devices malfunctioned during sighting.',
    hasImage: false
  },
  {
    id: 2,
    date: '2025-07-25',
    time: 'Afternoon',
    type: 'Poltergeist',
    location: 'New Orleans, Louisiana',
    lat: 30.192881,
    lng: -89.90185,
    notes: 'Apparition seen floating near old church grounds.',
    hasImage: false
  },
  {
    id: 3,
    date: '2021-10-19',
    time: 'Night',
    type: 'Poltergeist',
    location: 'Houston, Texas',
    lat: 29.627906,
    lng: -95.431614,
    notes: 'Local dog barking frantically before sighting.',
    hasImage: true
  }
];

export default function Home() {
  const [sightingsData, setSightingsData] = useState<Sighting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load CSV data on component mount
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/data/ghost_sightings_12000_with_images.csv');
        const csvText = await response.text();
        
        const lines = csvText.split('\n');
        const headers = parseCSVLine(lines[0]);
        
        console.log('CSV Headers:', headers);
        
        // Parse CSV data
        const parsedSightings = lines.slice(1) 
          .filter(line => line.trim())
          .map((line, index) => {
            const values = parseCSVLine(line);
            
            // CSV format: Date,Latitude,Longitude,City,State,Notes,Time,Type,Image
            const lat = parseFloat(values[1]); // Latitude is second column
            const lng = parseFloat(values[2]); // Longitude is third column
            
            // Debug first few entries
            if (index < 5) {
              console.log(`📊 CSV PARSING DEBUG ${index + 1}:`, {
                rawLine: line.substring(0, 100) + '...',
                parsedValues: values.slice(0, 5),
                lat: lat,
                lng: lng,
                location: `${values[3]}, ${values[4]}`
              });
            }
            
            // Validate coordinates - check for reasonable US bounds
            if (isNaN(lat) || isNaN(lng) || lat < 24 || lat > 50 || lng < -125 || lng > -66) {
              if (index < 10) {
                console.warn(`Invalid coordinates at row ${index + 2}:`, { lat, lng, values: values.slice(0, 5) });
              }
              return null;
            }
            
            return {
              id: index + 1,
              date: values[0] || 'Unknown',
              time: values[6] || 'Unknown',
              type: values[7] || 'Unknown',
              location: `${values[3] || 'Unknown'}, ${values[4] || 'Unknown'}`,
              lat: lat,
              lng: lng,
              notes: values[5] || 'No notes available',
              hasImage: !!(values[8] && values[8].trim()),
              imageUrl: values[8] && values[8].trim() ? values[8].trim() : null
            };
          })
          .filter(sighting => sighting !== null);
        
        console.log(`📊 Loaded ${parsedSightings.length} valid sightings from CSV`);
        setSightingsData(parsedSightings);
      } catch (error) {
        console.error('Error loading CSV data:', error);
        // Fall back to test data if CSV loading fails
        setSightingsData(testSightings);
      } finally {
        setIsLoading(false);
      }
    };

    loadCSVData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SightingsStats />
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Sightings Map</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="w-full h-96 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <div className="text-gray-300">Loading {sightingsData.length > 0 ? sightingsData.length : ''} ghost sightings...</div>
                </div>
              </div>
            ) : (
              <MapboxMap sightings={sightingsData} />
            )}
            <div className="p-4 bg-gray-800 text-center">
              <div className="text-sm text-gray-300">
                Powered by Mapbox GL JS • {sightingsData.length} sightings loaded
              </div>
            </div>
          </div>
        </div>

        <SightingsTable sightings={sightingsData} />
      </div>
    </div>
  );
}