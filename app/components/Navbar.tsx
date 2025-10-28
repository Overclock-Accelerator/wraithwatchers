'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-black text-white border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-lg sm:text-xl font-bold">👻 WraithWatchers</div>
          </Link>
          <div className="flex space-x-2 sm:space-x-4">
            <Link 
              href="/post-sighting"
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium"
            >
              Post a Sighting
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

