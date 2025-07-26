/*
  # Create book management schema

  1. New Tables
    - `books`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, not null)
      - `description` (text)
      - `genre` (text)
      - `sub_genre` (text)
      - `tone` (text)
      - `heat_level` (text)
      - `perspective` (text)
      - `target_audience` (text)
      - `cover_url` (text)
      - `status` (text, default 'draft')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `chapters`
      - `id` (uuid, primary key)
      - `book_id` (uuid, foreign key to books)
      - `title` (text, not null)
      - `description` (text)
      - `status` (text, default 'pending')
      - `order_index` (integer, default 0)
      - `created_at` (timestamp)
    - `sub_chapters`
      - `id` (uuid, primary key)
      - `chapter_id` (uuid, foreign key to chapters)
      - `title` (text, not null)
      - `description` (text)
      - `content` (text)
      - `status` (text, default 'pending')
      - `order_index` (integer, default 0)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Foreign Keys
    - books.user_id → auth.users.id (CASCADE DELETE)
    - chapters.book_id → books.id (CASCADE DELETE)
    - sub_chapters.chapter_id → chapters.id (CASCADE DELETE)
*/

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  genre text DEFAULT '',
  sub_genre text DEFAULT '',
  tone text DEFAULT '',
  heat_level text DEFAULT '',
  perspective text DEFAULT '',
  target_audience text DEFAULT '',
  cover_url text DEFAULT '',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'pending',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create sub_chapters table
CREATE TABLE IF NOT EXISTS sub_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  content text DEFAULT '',
  status text DEFAULT 'pending',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_chapters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for books
CREATE POLICY "Users can read own books"
  ON books
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books"
  ON books
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
  ON books
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for chapters
CREATE POLICY "Users can read own chapters"
  ON chapters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = chapters.book_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chapters"
  ON chapters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = chapters.book_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own chapters"
  ON chapters
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = chapters.book_id 
      AND books.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = chapters.book_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own chapters"
  ON chapters
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books 
      WHERE books.id = chapters.book_id 
      AND books.user_id = auth.uid()
    )
  );

-- Create RLS policies for sub_chapters
CREATE POLICY "Users can read own sub_chapters"
  ON sub_chapters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chapters 
      JOIN books ON books.id = chapters.book_id
      WHERE chapters.id = sub_chapters.chapter_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sub_chapters"
  ON sub_chapters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters 
      JOIN books ON books.id = chapters.book_id
      WHERE chapters.id = sub_chapters.chapter_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sub_chapters"
  ON sub_chapters
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chapters 
      JOIN books ON books.id = chapters.book_id
      WHERE chapters.id = sub_chapters.chapter_id 
      AND books.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters 
      JOIN books ON books.id = chapters.book_id
      WHERE chapters.id = sub_chapters.chapter_id 
      AND books.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_updated_at ON books(updated_at);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order_index ON chapters(order_index);
CREATE INDEX IF NOT EXISTS idx_sub_chapters_chapter_id ON sub_chapters(chapter_id);
CREATE INDEX IF NOT EXISTS idx_sub_chapters_order_index ON sub_chapters(order_index);