-- Fix doctor hospital assignment
UPDATE users 
SET hospital_id = '45b51d0a-fc51-4776-b570-0b77ecee6fe2'
WHERE email = 'vishwanathtanmai003@gmail.com';

-- Create Practitioner record for the doctor
INSERT INTO practitioners (id, active, name, identifiers, telecom, address, photo, qualification, communication, hospital_id, specialty, user_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  true,
  '[{"use": "official", "family": "Tanmai", "given": ["Malladi Vishwanath"]}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '45b51d0a-fc51-4776-b570-0b77ecee6fe2',
  'General Medicine',
  '122ee34a-581f-404c-b9e1-166b08183c48',
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM practitioners WHERE user_id = '122ee34a-581f-404c-b9e1-166b08183c48'
);

-- Link practitioner back to user
UPDATE users u
SET practitioner_id = p.id
FROM practitioners p
WHERE p.user_id = u.id AND u.email = 'vishwanathtanmai003@gmail.com';

-- Add 2 more real hospitals for the appointment booking dropdown
INSERT INTO hospitals (id, identifier, name, type, alias, telecom, address, hfr_id, active, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  'HOSP-002',
  'AIIMS Delhi',
  '[{"text": "Hospital"}]'::jsonb,
  '["AIIMS", "All India Institute of Medical Sciences"]'::jsonb,
  '[{"system": "phone", "value": "+91-11-2658-8500", "use": "work"}]'::jsonb,
  '[{"use": "work", "line": ["Ansari Nagar East"], "city": "New Delhi", "state": "Delhi", "postalCode": "110029", "country": "IN"}]'::jsonb,
  'HFR-DL-00001',
  true,
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'HOSP-003',
  'Apollo Hospitals Hyderabad',
  '[{"text": "Hospital"}]'::jsonb,
  '["Apollo Hyderbad"]'::jsonb,
  '[{"system": "phone", "value": "+91-40-2360-7777", "use": "work"}]'::jsonb,
  '[{"use": "work", "line": ["Jubilee Hills"], "city": "Hyderabad", "state": "Telangana", "postalCode": "500033", "country": "IN"}]'::jsonb,
  'HFR-TS-00001',
  true,
  NOW(), NOW()
)
ON CONFLICT (identifier) DO NOTHING;

-- Add a doctor for AIIMS Delhi
WITH hosp AS (SELECT id FROM hospitals WHERE identifier = 'HOSP-002')
INSERT INTO practitioners (id, active, name, identifiers, telecom, address, photo, qualification, communication, hospital_id, specialty, created_at, updated_at)
SELECT
  gen_random_uuid(), true,
  '[{"use": "official", "family": "Sharma", "given": ["Dr. Priya"]}]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
  hosp.id, 'Cardiology', NOW(), NOW()
FROM hosp
WHERE NOT EXISTS (SELECT 1 FROM practitioners WHERE specialty = 'Cardiology' AND hospital_id = (SELECT id FROM hospitals WHERE identifier = 'HOSP-002'));

-- Add a doctor for Apollo Hyderabad
WITH hosp AS (SELECT id FROM hospitals WHERE identifier = 'HOSP-003')
INSERT INTO practitioners (id, active, name, identifiers, telecom, address, photo, qualification, communication, hospital_id, specialty, created_at, updated_at)
SELECT
  gen_random_uuid(), true,
  '[{"use": "official", "family": "Reddy", "given": ["Dr. Arjun"]}]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
  hosp.id, 'Orthopedics', NOW(), NOW()
FROM hosp
WHERE NOT EXISTS (SELECT 1 FROM practitioners WHERE specialty = 'Orthopedics' AND hospital_id = (SELECT id FROM hospitals WHERE identifier = 'HOSP-003'));

SELECT 'Done' as status, 
  (SELECT count(*) FROM hospitals) as hospitals,
  (SELECT count(*) FROM practitioners) as practitioners,
  (SELECT hospital_id FROM users WHERE email = 'vishwanathtanmai003@gmail.com') as doctor_hospital;
