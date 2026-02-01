-- Remove banks from locations: banks are not redemption channels and are no longer shown on the map.
-- Migration: 010_remove_bank_locations.sql
-- Run this if your locations table was created with type 'bank' (e.g. before banks were removed).
-- 1) Delete existing bank rows
-- 2) Restrict location type to nampost_office, atm, warehouse only

DELETE FROM locations WHERE type = 'bank';

ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_type_check;
ALTER TABLE locations ADD CONSTRAINT locations_type_check CHECK (type IN ('nampost_office', 'atm', 'warehouse'));
