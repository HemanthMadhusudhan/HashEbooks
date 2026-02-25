import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Image, Loader2, X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/data/categories';
import { getUserFriendlyError } from '@/lib/errorUtils';

interface UploadBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadBookModal({ isOpen, onClose, onSuccess }: UploadBookModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBookChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBookFile(file);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setCategory('');
    setDescription('');
    setBookFile(null);
    setCoverFile(null);
    setCoverPreview(null);
  };

  // Sanitize filename to prevent path traversal attacks
  const sanitizeFilename = (filename: string): string => {
    return filename
      .replace(/\.\.\/|\.\.\\|[\x00-\x1f\x7f]/g, '') // Remove path traversal and control chars
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
      .slice(-100); // Limit length
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !bookFile) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and upload a book file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload book file with sanitized filename
      const bookFileName = `${user.id}/${Date.now()}_${sanitizeFilename(bookFile.name)}`;
      const { error: bookUploadError } = await supabase.storage
        .from('books')
        .upload(bookFileName, bookFile);

      if (bookUploadError) throw bookUploadError;

      const { data: bookUrlData } = supabase.storage
        .from('books')
        .getPublicUrl(bookFileName);

      // Upload cover if provided with sanitized filename
      let coverUrl = null;
      if (coverFile) {
        const coverFileName = `${user.id}/covers/${Date.now()}_${sanitizeFilename(coverFile.name)}`;
        const { error: coverUploadError } = await supabase.storage
          .from('books')
          .upload(coverFileName, coverFile);

        if (coverUploadError) throw coverUploadError;

        const { data: coverUrlData } = supabase.storage
          .from('books')
          .getPublicUrl(coverFileName);
        
        coverUrl = coverUrlData.publicUrl;
      }

      // Insert book record
      const { error: insertError } = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          title,
          author,
          category,
          description,
          file_url: bookUrlData.publicUrl,
          cover_url: coverUrl,
          file_type: bookFile.name.split('.').pop() || 'pdf',
        });

      if (insertError) throw insertError;

      toast({
        title: "Book submitted for review!",
        description: "Your book has been submitted and is pending admin approval.",
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast({
        title: "Upload failed",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary" />
            Upload a Book
          </DialogTitle>
          <DialogDescription className="flex items-start gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Uploaded books will be publicly accessible. Do not upload copyrighted or private content.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Book Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the book"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Book File (PDF, EPUB, TXT) *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.epub,.txt"
                onChange={handleBookChange}
                className="hidden"
                id="book-file"
                required
              />
              <label htmlFor="book-file" className="cursor-pointer">
                {bookFile ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">{bookFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setBookFile(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <p>Click to upload book file</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cover Image (optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
                id="cover-file"
              />
              <label htmlFor="cover-file" className="cursor-pointer">
                {coverPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="max-h-32 rounded-lg mx-auto"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute -top-2 -right-2"
                      onClick={(e) => {
                        e.preventDefault();
                        setCoverFile(null);
                        setCoverPreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <Image className="w-8 h-8 mx-auto mb-2" />
                    <p>Click to upload cover image</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading} className="flex-1">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Book
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
