ALTER TABLE countries
ADD COLUMN region VARCHAR(100) NOT NULL DEFAULT 'Uncategorized';

ALTER TABLE countries
ADD COLUMN sub_region VARCHAR(100);

CREATE INDEX idx_countries_region ON countries(region);
CREATE INDEX idx_countries_sub_region ON countries(sub_region);