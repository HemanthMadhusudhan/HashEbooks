import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Edit, Search, Shield, Loader2, Check, X, Clock } from 'lucide-react';
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

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onBookUpdated: () => void;
}

type BookWithStatus = Book & { status: 'pending' | 'approved' | 'rejected' };

export function AdminPanel({ isOpen, onClose, onBookUpdated }: AdminPanelProps) {
  const { toast } = useToast();
  const [books, setBooks] = useState<BookWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteBook, setDeleteBook] = useState<BookWithStatus | null>(null);
  const [editBook, setEditBook] = useState<BookWithStatus | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchAllBooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBooks(data as BookWithStatus[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllBooks();
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (!deleteBook) return;

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', deleteBook.id);

    if (error) {
      toast({
        title: 'Delete failed',
        description: 'Unable to delete the book. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Book deleted',
        description: `"${deleteBook.title}" has been removed.`,
      });
      fetchAllBooks();
      onBookUpdated();
    }
    setDeleteBook(null);
  };

  const handleEdit = async () => {
    if (!editBook) return;

    setSaving(true);
    const { error } = await supabase
      .from('books')
      .update({ title: editTitle, author: editAuthor })
      .eq('id', editBook.id);

    if (error) {
      toast({
        title: 'Update failed',
        description: 'Unable to update the book. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Book updated',
        description: 'Changes saved successfully.',
      });
      fetchAllBooks();
      onBookUpdated();
    }
    setSaving(false);
    setEditBook(null);
  };

  const handleStatusChange = async (book: BookWithStatus, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('books')
      .update({ status: newStatus } as any)
      .eq('id', book.id);

    if (error) {
      toast({
        title: 'Status update failed',
        description: 'Unable to update the book status. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: newStatus === 'approved' ? 'Book approved!' : 'Book rejected',
        description: newStatus === 'approved' 
          ? `"${book.title}" is now live.` 
          : `"${book.title}" has been rejected.`,
      });
      
      // Send email notification to the book owner
      try {
        const { error: emailError } = await supabase.functions.invoke('send-book-status-email', {
          body: {
            bookId: book.id,
            bookTitle: book.title,
            status: newStatus,
            userId: book.user_id,
          },
        });
        
        if (emailError) {
          console.error('Failed to send notification email:', emailError);
        } else {
          console.log('Notification email sent successfully');
        }
      } catch (emailErr) {
        console.error('Error sending notification email:', emailErr);
      }
      
      fetchAllBooks();
      onBookUpdated();
    }
  };

  const openEditDialog = (book: BookWithStatus) => {
    setEditBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author);
  };

  const filteredBooks = books.filter(
    (book) =>
      (book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())) &&
      book.status === activeTab
  );

  const pendingCount = books.filter(b => b.status === 'pending').length;
  const approvedCount = books.filter(b => b.status === 'approved').length;
  const rejectedCount = books.filter(b => b.status === 'rejected').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Admin Panel
            </DialogTitle>
            <DialogDescription>
              Manage all books in the library. Review pending submissions, approve or reject content.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Approved ({approvedCount})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Rejected ({rejectedCount})
              </TabsTrigger>
            </TabsList>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <TabsContent value={activeTab} className="flex-1 overflow-auto border rounded-lg mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No {activeTab} books found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBooks.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {book.title}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {book.author}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {book.category.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(book.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(book.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {book.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStatusChange(book, 'approved')}
                                  className="text-primary hover:text-primary hover:bg-primary/10"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStatusChange(book, 'rejected')}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {book.status === 'rejected' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStatusChange(book, 'approved')}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            {book.status === 'approved' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStatusChange(book, 'rejected')}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(book)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteBook(book)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>

          <div className="text-sm text-muted-foreground">
            {filteredBooks.length} book{filteredBooks.length !== 1 && 's'} in {activeTab}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBook} onOpenChange={() => setDeleteBook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteBook?.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editBook} onOpenChange={() => setEditBook(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>
              Update the book details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Author</label>
              <Input
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditBook(null)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
