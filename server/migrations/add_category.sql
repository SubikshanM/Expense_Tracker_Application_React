-- Add category column to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Other';

-- Update existing records to have a default category
UPDATE expenses 
SET category = 'Other' 
WHERE category IS NULL;
