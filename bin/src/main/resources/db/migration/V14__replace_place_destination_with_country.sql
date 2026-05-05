ALTER TABLE places
RENAME COLUMN destination_id TO country_id;

ALTER TABLE places
DROP CONSTRAINT IF EXISTS fk_places_destination;

ALTER TABLE places
ADD CONSTRAINT fk_places_country
FOREIGN KEY (country_id)
REFERENCES countries(id)
ON DELETE CASCADE;