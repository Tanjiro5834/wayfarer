-- 1. Rename column
ALTER TABLE trips
RENAME COLUMN destination_id TO country_id;

-- 2. Drop old FK (if exists)
ALTER TABLE trips
DROP CONSTRAINT IF EXISTS fk_trips_destination;

-- 3. Add new FK
ALTER TABLE trips
ADD CONSTRAINT fk_trips_country
FOREIGN KEY (country_id)
REFERENCES countries(id)
ON DELETE CASCADE;