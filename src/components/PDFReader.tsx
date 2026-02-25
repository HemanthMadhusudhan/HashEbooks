import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Download, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useReadingProgress } from '@/hooks/useReadingProgress';

interface PDFReaderProps {
  fileUrl: string;
  title: string;
  bookId: string;
  onBack: () => void;
}

export function PDFReader({ fileUrl, title, bookId, onBack }: PDFReaderProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const { progress, saveProgress } = useReadingProgress(bookId);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (progress?.current_page) {
      setCurrentPage(progress.current_page);
      if (progress.total_pages) {
        setTotalPages(progress.total_pages);
      }
    }
  }, [progress]);

  const debouncedSaveProgress = useCallback(
    (page: number, total?: number) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveProgress(page, total);
      }, 1000);
    },
    [saveProgress]
  );

  useEffect(() => {
    if (currentPage > 0) {
      debouncedSaveProgress(currentPage, totalPages || undefined);
    }
  }, [currentPage, totalPages, debouncedSaveProgress]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleBack = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveProgress(currentPage, totalPages || undefined);
    onBack();
  };

  const progressPercent = totalPages ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="font-serif text-lg font-semibold truncate max-w-md">
                {title}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(fileUrl, '_blank')}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={fileUrl} download>
                  <Download className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <Progress value={progressPercent} className="flex-1 h-2" />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={totalPages || undefined}
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center text-sm border rounded px-2 py-1 bg-background"
              />
              <span className="text-sm text-muted-foreground">
                / {totalPages || '?'}
              </span>
              {!totalPages && (
                <input
                  type="number"
                  min={1}
                  placeholder="Total"
                  onChange={(e) => setTotalPages(parseInt(e.target.value) || null)}
                  className="w-16 text-center text-sm border rounded px-2 py-1 bg-background"
                />
              )}
            </div>
            <span className="text-sm font-medium text-primary min-w-[3rem]">
              {progressPercent}%
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-muted/30">
        <iframe
          ref={iframeRef}
          src={`${fileUrl}#zoom=${zoom}&page=${currentPage}`}
          className="w-full h-[calc(100vh-7rem)]"
          title={title}
        />
      </div>
    </div>
  );
}
