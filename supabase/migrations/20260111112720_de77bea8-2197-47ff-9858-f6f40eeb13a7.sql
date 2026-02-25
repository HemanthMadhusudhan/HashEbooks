-- Drop existing insert policy and recreate
DROP POLICY IF EXISTS "Users can insert own books" ON public.books;

CREATE POLICY "Users can insert own books"
ON public.books FOR INSERT
WITH CHECK (auth.uid() = user_id);