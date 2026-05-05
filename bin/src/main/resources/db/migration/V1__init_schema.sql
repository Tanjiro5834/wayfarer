CREATE TABLE countries (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(255),
    capital VARCHAR(255),
    currency VARCHAR(255),
    language VARCHAR(255),
    time_zone VARCHAR(255),
    best_time_to_visit VARCHAR(255),
    safety_level VARCHAR(255),
    flag_url VARCHAR(255),
    overview VARCHAR(2000),
    view_count INT DEFAULT 0
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(255)
);

CREATE TABLE budget_guides (
    id BIGSERIAL PRIMARY KEY,
    country_id BIGINT NOT NULL UNIQUE,
    budget_daily NUMERIC(38,2),
    mid_range_daily NUMERIC(38,2),
    luxury_daily NUMERIC(38,2),
    average_hotel_cost NUMERIC(38,2),
    average_meal_cost NUMERIC(38,2),
    average_transport_cost NUMERIC(38,2),
    currency VARCHAR(255),
    CONSTRAINT fk_budget_guides_country
        FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE entry_requirements (
    id BIGSERIAL PRIMARY KEY,
    country_id BIGINT NOT NULL UNIQUE,
    visa_required BOOLEAN,
    passport_validity_rule VARCHAR(255),
    required_documents VARCHAR(255),
    return_ticket_required BOOLEAN,
    proof_of_accommodation_required BOOLEAN,
    travel_insurance_required BOOLEAN,
    vaccination_requirements VARCHAR(255),
    customs_notes VARCHAR(2000),
    CONSTRAINT fk_entry_requirements_country
        FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE culture_guide_items (
    id BIGSERIAL PRIMARY KEY,
    country_id BIGINT NOT NULL,
    type VARCHAR(255) NOT NULL,
    content VARCHAR(1000) NOT NULL,
    CONSTRAINT fk_culture_guide_items_country
        FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE local_tips (
    id BIGSERIAL PRIMARY KEY,
    country_id BIGINT NOT NULL,
    category VARCHAR(255) NOT NULL,
    tip VARCHAR(1000) NOT NULL,
    CONSTRAINT fk_local_tips_country
        FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE packing_checklist_items (
    id BIGSERIAL PRIMARY KEY,
    country_id BIGINT NOT NULL,
    category VARCHAR(255) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    essential BOOLEAN,
    note VARCHAR(255),
    CONSTRAINT fk_packing_checklist_items_country
        FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE saved_destinations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    country_id BIGINT NOT NULL,
    saved_at TIMESTAMP,
    CONSTRAINT uq_saved_destinations_user_country UNIQUE (user_id, country_id),
    CONSTRAINT fk_saved_destinations_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_saved_destinations_country
        FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE INDEX idx_culture_guide_items_country_id ON culture_guide_items(country_id);
CREATE INDEX idx_local_tips_country_id ON local_tips(country_id);
CREATE INDEX idx_packing_checklist_items_country_id ON packing_checklist_items(country_id);
CREATE INDEX idx_saved_destinations_user_id ON saved_destinations(user_id);
CREATE INDEX idx_saved_destinations_country_id ON saved_destinations(country_id);