ALTER TABLE budget_guides
ADD COLUMN saving_tips TEXT;

CREATE TABLE budget_tiers (
    id BIGSERIAL PRIMARY KEY,
    budget_guide_id BIGINT NOT NULL REFERENCES budget_guides(id) ON DELETE CASCADE,
    tier_name VARCHAR(50) NOT NULL,

    accommodation_min NUMERIC(10,2),
    accommodation_max NUMERIC(10,2),

    food_min NUMERIC(10,2),
    food_max NUMERIC(10,2),

    transport_min NUMERIC(10,2),
    transport_max NUMERIC(10,2),

    activities_min NUMERIC(10,2),
    activities_max NUMERIC(10,2),

    daily_total_min NUMERIC(10,2),
    daily_total_max NUMERIC(10,2)
);