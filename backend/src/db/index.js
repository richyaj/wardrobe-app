import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wardrobe_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('shirt','tee','hoodie','bottom')),
      color TEXT,
      image_url TEXT,
      image_public_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE wardrobe_items ADD COLUMN IF NOT EXISTS rotation INTEGER DEFAULT 0;
    ALTER TABLE schedules ADD COLUMN IF NOT EXISTS start_date DATE;
    ALTER TABLE schedules ADD COLUMN IF NOT EXISTS start_week_idx INTEGER DEFAULT 0;

    CREATE TABLE IF NOT EXISTS schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      data JSONB NOT NULL,
      generated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Database initialized');
}
