-- Rebrand store product names shown to players. Only display text changes:
-- ids and commandTemplate stay as they are, because they must match the
-- in-game rank and crate names that deliveries run against.
UPDATE "Package" SET
  "name" = REPLACE(REPLACE("name", 'Moon SMP', 'Gilded SMP'), 'Moon', 'Gilded'),
  "description" = REPLACE(REPLACE(REPLACE("description", 'Moon SMP', 'Gilded SMP'), 'MoonSMP', 'Gilded SMP'), 'Moon', 'Gilded')
WHERE "name" LIKE '%Moon%' OR "description" LIKE '%Moon%';
