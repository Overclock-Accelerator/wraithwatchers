import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WraithWatchers",
  description: "Track and report ghost sightings in your area",
};

function Navbar() {
  return (
    <nav className="bg-black text-white border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="text-lg sm:text-xl font-bold">👻 WraithWatchers</div>
          </div>
          <div className="flex space-x-2 sm:space-x-4">
            <button className="text-white hover:text-gray-300 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium">
              Sightings Map
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium">
              Post a Sighting
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-black text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center text-sm text-gray-400">
          Footer
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css"
        />
      </head>
      <body className={`${inter.className} antialiased bg-black text-white min-h-screen`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
