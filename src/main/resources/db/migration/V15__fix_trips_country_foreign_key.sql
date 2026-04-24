ALTER TABLE trips
DROP CONSTRAINT IF EXISTS trips_destination_id_fkey;

ALTER TABLE trips
DROP CONSTRAINT IF EXISTS fk_trips_destination;

ALTER TABLE trips
DROP CONSTRAINT IF EXISTS fk_trips_country;

ALTER TABLE trips
ADD CONSTRAINT fk_trips_country
FOREIGN KEY (country_id)
REFERENCES countries(id)
ON DELETE CASCADE;