
-- Create storage bucket for submission images
INSERT INTO storage.buckets (id, name, public) VALUES ('submission-images', 'submission-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload submission images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'submission-images');

-- Allow authenticated users to view images from their tenant
CREATE POLICY "Anyone can view submission images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'submission-images');
