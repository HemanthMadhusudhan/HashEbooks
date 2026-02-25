-- Create a public view for books that excludes user_id to protect user privacy
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
  FROM public.books;
-- Note: user_id is intentionally excluded to prevent tracking who uploaded which books

-- Grant access to the view for authenticated and anonymous users
GRANT SELECT ON public.books_public TO anon, authenticated;