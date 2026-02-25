-- Add status column for book verification
ALTER TABLE public.books 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create index for faster filtering
CREATE INDEX idx_books_status ON public.books(status);

-- Update the books_public view to only show approved books
DROP VIEW IF EXISTS public.books_public;

CREATE VIEW public.books_public
WITH (security_invoker=on) AS
SELECT 
  id,
  title,
  author,
  category,
  description,
  cover_url,
  file_url,
  file_type,
  created_at,
  updated_at
FROM public.books
WHERE status = 'approved';

-- Update existing books to approved so they remain visible
UPDATE public.books SET status = 'approved' WHERE status = 'pending';