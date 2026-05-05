-- 1. Rename column (keep existing data if any)
ALTER TABLE trips
RENAME COLUMN destination_id TO country_id;

-- 2. Add foreign key to countries table
ALTER TABLE trips
ADD CONSTRAINT fk_trips_country
FOREIGN KEY (country_id)
REFERENCES countries(id)
ON DELETE CASCADE;

-- 3. (Optional) Drop old FK if it exists (safe guard)
-- Only run this if you had a FK to destinations before
-- ALTER TABLE trips DROP CONSTRAINT fk_trips_destination;

-- 4. (Optional) If destinations table is no longer used, you can drop it later
-- DROP TABLE destinations;