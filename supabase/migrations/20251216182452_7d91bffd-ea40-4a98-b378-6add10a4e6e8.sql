-- Make the documents bucket public so shared documents are accessible
UPDATE storage.buckets SET public = true WHERE id = 'documents';