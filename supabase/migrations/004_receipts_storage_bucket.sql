-- Create receipts storage bucket (idempotent — skips if already exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated and anon users to upload to receipts bucket (service_role is always allowed)
CREATE POLICY "Allow uploads to receipts bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts');

-- Allow authenticated and anon users to read from receipts bucket
CREATE POLICY "Allow reads from receipts bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');
