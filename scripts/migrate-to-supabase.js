const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const TABLE_NAME = 'ghost_sightings';

// This function is no longer needed - we check table existence directly
// and provide SQL if needed in the main migrate() function

// Parse CSV and return array of records
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns to database columns
        const record = {
          date_of_sighting: row['Date of Sighting'],
          latitude: parseFloat(row['Latitude of Sighting']),
          longitude: parseFloat(row['Longitude of Sighting']),
          city: row['Nearest Approximate City'] || null,
          state: row['US State'] || null,
          notes: row['Notes about the sighting'] || null,
          time_of_day: row['Time of Day'] || null,
          apparition_tag: row['Tag of Apparition'] || null,
          image_link: row['Image Link'] || null,
        };
        
        // Only add valid records
        if (record.date_of_sighting && !isNaN(record.latitude) && !isNaN(record.longitude)) {
          results.push(record);
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Insert records in batches
async function insertRecords(records) {
  console.log(`📤 Inserting ${records.length} records...`);
  
  const batchSize = 1000;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      const progress = Math.min(i + batchSize, records.length);
      console.log(`   Progress: ${progress}/${records.length} (${Math.round(progress / records.length * 100)}%)`);
    }
  }
  
  console.log(`✅ Successfully inserted ${inserted} records`);
  if (errors > 0) {
    console.log(`⚠️  Failed to insert ${errors} records`);
  }
  
  return { inserted, errors };
}

// Check if table exists and has data
async function checkExistingData() {
  const { count, error } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    // PGRST116 = relation does not exist (table not created yet)
    // 42P01 = undefined_table
    if (error.code === 'PGRST116' || error.code === '42P01' || error.message.includes('does not exist')) {
      return null; // Table doesn't exist
    }
    console.error('❌ Error checking existing data:', error.message);
    return null;
  }
  
  return count || 0;
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting migration to Supabase...\n');
  
  // Check for existing data
  const existingCount = await checkExistingData();
  
  if (existingCount === null) {
    console.log('📋 Table does not exist yet. You need to create it first.\n');
    
    // Show SQL to create table
    const createTableSQL = `
-- Copy and paste this entire SQL block into your Supabase SQL Editor
-- Go to: https://app.supabase.com → Your Project → SQL Editor → New Query

CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_of_sighting DATE NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  city VARCHAR(255),
  state VARCHAR(100),
  notes TEXT,
  time_of_day VARCHAR(50),
  apparition_tag VARCHAR(100),
  image_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ghost_sightings_location ON ${TABLE_NAME} (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_ghost_sightings_date ON ${TABLE_NAME} (date_of_sighting);
CREATE INDEX IF NOT EXISTS idx_ghost_sightings_state ON ${TABLE_NAME} (state);

-- Enable Row Level Security
ALTER TABLE ${TABLE_NAME} ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON ${TABLE_NAME};
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ${TABLE_NAME};
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON ${TABLE_NAME};
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON ${TABLE_NAME};

-- Create policies for public read access
CREATE POLICY "Enable read access for all users" ON ${TABLE_NAME}
  FOR SELECT USING (true);

-- Create policies for authenticated write access
CREATE POLICY "Enable insert for authenticated users only" ON ${TABLE_NAME}
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON ${TABLE_NAME}
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON ${TABLE_NAME}
  FOR DELETE USING (auth.role() = 'authenticated');
`;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                    📝 SQL TO RUN IN SUPABASE                        ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(createTableSQL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 STEPS:');
    console.log('  1. Go to: https://app.supabase.com');
    console.log('  2. Open your project');
    console.log('  3. Click "SQL Editor" in the left sidebar');
    console.log('  4. Click "New Query"');
    console.log('  5. Copy and paste the SQL above');
    console.log('  6. Click "Run" or press Ctrl+Enter');
    console.log('  7. Come back here and run: npm run migrate\n');
    
    return;
  } else if (existingCount > 0) {
    console.log(`⚠️  Warning: Table already contains ${existingCount} records.`);
    console.log('This script will add more records. To start fresh, delete the table first.\n');
  } else {
    console.log('✅ Table exists and is empty. Ready to import data.\n');
  }
  
  // Parse CSV
  console.log('📖 Reading CSV file...');
  const csvPath = path.join(__dirname, '../public/data/ghost_sightings_12000_with_images.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }
  
  const records = await parseCSV(csvPath);
  console.log(`✅ Parsed ${records.length} valid records from CSV\n`);
  
  // Insert records
  const result = await insertRecords(records);
  
  console.log('\n🎉 Migration complete!');
  console.log(`   Total inserted: ${result.inserted}`);
  console.log(`   Total errors: ${result.errors}`);
  console.log('\n📊 Your data is now accessible via Supabase!');
  console.log(`   Project URL: ${supabaseUrl}`);
  console.log(`   Table name: ${TABLE_NAME}`);
  console.log('\n🔒 Security settings:');
  console.log('   ✓ Public read access enabled (anyone can view)');
  console.log('   ✓ Write access restricted to authenticated users only');
}

// Run the migration
migrate().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

