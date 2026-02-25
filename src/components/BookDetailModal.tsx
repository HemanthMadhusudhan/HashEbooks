import { useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, User, Calendar, FileText, Lock, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface BookDetailModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onRead: () => void;
  onBookDeleted?: () => void;
}

export function BookDetailModal({ book, isOpen, onClose, onRead, onBookDeleted }: BookDetailModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const checkOwnership = async () => {
      if (!book || !user) {
        setIsOwner(false);
        return;
      }
      
      // Check if user owns this book
      const { data, error } = await supabase
        .from('books')
        .select('user_id')
        .eq('id', book.id)
        .single();
      
      if (!error && data) {
        setIsOwner(data.user_id === user.id);
      }
    };
    
    checkOwnership();
  }, [book, user]);
  
  if (!book) return null;

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

  const handleLoginRedirect = () => {
    onClose();
    navigate('/auth');
  };

  const handleDelete = async () => {
    if (!book) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id);
      
      if (error) throw error;
      
      toast.success('Book deleted successfully');
      onClose();
      onBookDeleted?.();
    } catch (error: any) {
      toast.error('Failed to delete book: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{book.title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-full md:w-48 aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto text-primary/40 mb-2" />
                    <span className="text-3xl">{categoryIcons[book.category] || '📚'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                {book.title}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{book.author}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {categoryIcons[book.category]} {book.category.replace('-', ' ')}
              </Badge>
              <Badge variant="outline">
                <FileText className="w-3 h-3 mr-1" />
                {book.file_type.toUpperCase()}
              </Badge>
            </div>
            
            {book.description && (
              <p className="text-muted-foreground leading-relaxed">
                {book.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Added on {new Date(book.created_at).toLocaleDateString()}</span>
            </div>
            
            {user ? (
              <div className="space-y-3 pt-4">
                <div className="flex gap-3">
                  <Button onClick={onRead} className="flex-1 gap-2">
                    <BookOpen className="w-4 h-4" />
                    Read Now
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={book.file_url} download className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </Button>
                </div>
                
                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full gap-2" disabled={isDeleting}>
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Delete My Book
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this book?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{book.title}" from the library. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ) : (
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg">
                  <Lock className="w-4 h-4" />
                  <span>Sign in to read books</span>
                </div>
                <Button onClick={handleLoginRedirect} className="w-full gap-2">
                  <Lock className="w-4 h-4" />
                  Sign In to Access
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
