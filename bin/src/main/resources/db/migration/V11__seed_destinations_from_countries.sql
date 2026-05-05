INSERT INTO destinations (id, name, description, type, is_published)
SELECT
  id,
  name,
  overview,
  'COUNTRY',
  true
FROM countries
ON CONFLICT (id) DO NOTHING;