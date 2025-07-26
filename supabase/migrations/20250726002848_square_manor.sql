/*
  # Add author field to books table

  1. Schema Changes
    - Add `author` column to `books` table
    - Set default value for existing records
    - Allow null values for flexibility

  2. Notes
    - Existing books will have null author initially
    - Users can update author information later
    - Author name will be used in book cover generation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'author'
  ) THEN
    ALTER TABLE books ADD COLUMN author text;
  END IF;
END $$;