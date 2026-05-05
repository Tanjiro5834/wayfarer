CREATE TABLE IF NOT EXISTS destinations (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    type         VARCHAR(50)  NOT NULL,
    description  TEXT,
    is_published BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP,
    updated_at   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS places (
    id                           BIGSERIAL PRIMARY KEY,
    destination_id               BIGINT        NOT NULL REFERENCES destinations(id),
    category_id                  BIGINT        NOT NULL REFERENCES categories(id),
    name                         VARCHAR(255)  NOT NULL,
    description                  TEXT,
    address                      VARCHAR(255),
    latitude                     DOUBLE PRECISION,
    longitude                    DOUBLE PRECISION,
    estimated_cost               NUMERIC(10,2),
    recommended_duration_minutes INTEGER,
    opening_hours                VARCHAR(255),
    contact_info                 VARCHAR(255),
    is_featured                  BOOLEAN NOT NULL DEFAULT FALSE,
    is_published                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                   TIMESTAMP,
    updated_at                   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT       NOT NULL,
    destination_id BIGINT       NOT NULL REFERENCES destinations(id),
    title          VARCHAR(255) NOT NULL,
    start_date     DATE,
    end_date       DATE,
    total_budget   NUMERIC(10,2),
    travel_style   VARCHAR(50),
    status         VARCHAR(50)  NOT NULL DEFAULT 'DRAFT',
    notes          TEXT,
    created_at     TIMESTAMP,
    updated_at     TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_days (
    id         BIGSERIAL PRIMARY KEY,
    trip_id    BIGINT  NOT NULL REFERENCES trips(id),
    day_number INTEGER NOT NULL,
    date       DATE,
    notes      TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_activities (
    id             BIGSERIAL PRIMARY KEY,
    trip_day_id    BIGINT       NOT NULL REFERENCES trip_days(id),
    place_id       BIGINT       REFERENCES places(id),
    title          VARCHAR(255) NOT NULL,
    start_time     TIME,
    end_time       TIME,
    estimated_cost NUMERIC(10,2),
    sort_order     INTEGER,
    notes          TEXT,
    created_at     TIMESTAMP,
    updated_at     TIMESTAMP
);