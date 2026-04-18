ALTER TABLE entry_requirements
DROP COLUMN IF EXISTS passport_validity_rule,
DROP COLUMN IF EXISTS visa_required,
DROP COLUMN IF EXISTS return_ticket_required,
DROP COLUMN IF EXISTS proof_of_accommodation_required,
DROP COLUMN IF EXISTS travel_insurance_required;