import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ReadingProgress {
  current_page: number;
  total_pages: number | null;
  last_read_at: string;
}

export function useReadingProgress(bookId: string | null) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !bookId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      const { data, error } = await (supabase
        .from('reading_progress' as any)
        .select('current_page, total_pages, last_read_at')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle() as any);

      if (!error && data) {
        setProgress(data as ReadingProgress);
      }
      setLoading(false);
    };

    fetchProgress();
  }, [user, bookId]);

  const saveProgress = useCallback(
    async (currentPage: number, totalPages?: number) => {
      if (!user || !bookId) return;

      const progressData = {
        user_id: user.id,
        book_id: bookId,
        current_page: currentPage,
        total_pages: totalPages || null,
        last_read_at: new Date().toISOString(),
      };

      const { error } = await (supabase
        .from('reading_progress' as any)
        .upsert(progressData, { onConflict: 'user_id,book_id' }) as any);

      if (!error) {
        setProgress({
          current_page: currentPage,
          total_pages: totalPages || null,
          last_read_at: progressData.last_read_at,
        });
      }
    },
    [user, bookId]
  );

  return { progress, loading, saveProgress };
}

export function useAllReadingProgress() {
  const { user } = useAuth();
  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProgressMap({});
      setLoading(false);
      return;
    }

    const fetchAllProgress = async () => {
      const { data, error } = await (supabase
        .from('reading_progress' as any)
        .select('book_id, current_page, total_pages, last_read_at')
        .eq('user_id', user.id) as any);

      if (!error && data) {
        const map: Record<string, ReadingProgress> = {};
        (data as any[]).forEach((item) => {
          map[item.book_id] = {
            current_page: item.current_page,
            total_pages: item.total_pages,
            last_read_at: item.last_read_at,
          };
        });
        setProgressMap(map);
      }
      setLoading(false);
    };

    fetchAllProgress();
  }, [user]);

  return { progressMap, loading };
}
