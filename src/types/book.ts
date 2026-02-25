export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  category: string;
  description: string | null;
  cover_url: string | null;
  file_url: string;
  file_type: string;
  created_at: string;
  updated_at: string;
  publisher_name?: string | null;
}
