-- Drop and recreate the books_public view to include uploader name
DROP VIEW IF EXISTS public.books_public;

CREATE VIEW public.books_public
WITH (security_invoker=on) AS
  SELECT 
    b.id,
    b.created_at,
    b.updated_at,
    b.title,
    b.author,
    b.category,
    b.description,
    b.cover_url,
    b.file_url,
    b.file_type,
    COALESCE(p.display_name, 'Anonymous') as publisher_name
  FROM public.books b
  LEFT JOIN public.profiles p ON b.user_id = p.id
  WHERE b.status = 'approved';