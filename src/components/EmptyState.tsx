import { BookOpen, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface EmptyStateProps {
  hasSearch: boolean;
  onUploadClick: () => void;
}

export function EmptyState({ hasSearch, onUploadClick }: EmptyStateProps) {
  const { user } = useAuth();

  return (
    <div className="text-center py-20 px-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
        <BookOpen className="w-10 h-10 text-primary" />
      </div>
      
      {hasSearch ? (
        <>
          <h3 className="text-2xl font-serif font-semibold text-foreground mb-3">
            No books found
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Try adjusting your search or filter criteria
          </p>
        </>
      ) : (
        <>
          <h3 className="text-2xl font-serif font-semibold text-foreground mb-3">
            No books found
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {user 
              ? 'No books yet. Be the first to upload!'
              : 'Sign in to read books'}
          </p>
          {user && (
            <Button onClick={onUploadClick} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Book
            </Button>
          )}
        </>
      )}
    </div>
  );
}
