-- clean old places FK
ALTER TABLE places
DROP CONSTRAINT IF EXISTS places_destination_id_fkey;

-- rename old NOT NULL constraint names for clarity
ALTER TABLE trips
RENAME CONSTRAINT trips_destination_id_not_null TO trips_country_id_not_null;

ALTER TABLE places
RENAME CONSTRAINT places_destination_id_not_null TO places_country_id_not_null;

-- ensure correct FK exists for places
ALTER TABLE places
DROP CONSTRAINT IF EXISTS fk_places_country;

ALTER TABLE places
ADD CONSTRAINT fk_places_country
FOREIGN KEY (country_id)
REFERENCES countries(id)
ON DELETE CASCADE;