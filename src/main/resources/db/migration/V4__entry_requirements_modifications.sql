ALTER TABLE entry_requirements
ADD COLUMN visa_type VARCHAR(50),
ADD COLUMN max_stay_days INT,
ADD COLUMN passport_validity_required TEXT,
ADD COLUMN travel_insurance VARCHAR(50),
ADD COLUMN additional_notes TEXT;