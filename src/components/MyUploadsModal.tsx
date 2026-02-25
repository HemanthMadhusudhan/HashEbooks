import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';
import { toast } from '@/hooks/use-toast';

interface MyUploadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookDeleted: () => void;
}

export function MyUploadsModal({ isOpen, onClose, onBookDeleted }: MyUploadsModalProps) {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteBook, setDeleteBook] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchMyBooks();
    }
  }, [isOpen, user]);

  const fetchMyBooks = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBooks(data as Book[]);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteBook) return;

    setDeleting(true);
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', deleteBook.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete book. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Book Deleted',
        description: `"${deleteBook.title}" has been removed.`,
      });
      setBooks(books.filter(b => b.id !== deleteBook.id));
      onBookDeleted();
    }
    
    setDeleting(false);
    setDeleteBook(null);
  };

  const categoryIcons: Record<string, string> = {
    horror: '👻',
    mystery: '🔍',
    crime: '🔫',
    fantasy: '🐉',
    fiction: '📖',
    biography: '👤',
    comic: '💥',
    mythology: '⚡',
    history: '🏛️',
    'self-development': '🧠',
    sports: '⚽',
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="w-5 h-5 text-primary" />
              My Uploads
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">You haven't uploaded any books yet.</p>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <AnimatePresence>
                  {books.map((book, index) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors duration-200">
                        {/* Book Cover */}
                        <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                          {book.cover_url ? (
                            <img
                              src={book.cover_url}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-2xl">{categoryIcons[book.category] || '📚'}</span>
                            </div>
                          )}
                        </div>

                        {/* Book Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{book.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {categoryIcons[book.category]} {book.category.replace('-', ' ')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {book.file_type?.toUpperCase()}
                            </Badge>
                            {/* Status Badge */}
                            <Badge 
                              variant={(book as any).status === 'approved' ? 'default' : (book as any).status === 'rejected' ? 'destructive' : 'secondary'}
                              className="text-xs capitalize"
                            >
                              {(book as any).status === 'approved' ? '✓ Approved' : (book as any).status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                            </Badge>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteBook(book)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              {books.length} {books.length === 1 ? 'book' : 'books'} uploaded
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBook} onOpenChange={(open) => !open && setDeleteBook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete Book
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteBook?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}