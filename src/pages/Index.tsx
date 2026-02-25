import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useAllReadingProgress } from '@/hooks/useReadingProgress';
import { Book } from '@/types/book';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { CategoryFilterNew } from '@/components/CategoryFilterNew';
import { BookCardNew } from '@/components/BookCardNew';
import { BookDetailModal } from '@/components/BookDetailModal';
import { UploadBookModal } from '@/components/UploadBookModal';
import { AdminPanel } from '@/components/AdminPanel';
import { UserManagement } from '@/components/UserManagement';
import { PDFReader } from '@/components/PDFReader';
import { EmptyState } from '@/components/EmptyState';
import { MyUploadsModal } from '@/components/MyUploadsModal';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const { progressMap } = useAllReadingProgress();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [isMyUploadsOpen, setIsMyUploadsOpen] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    
    // Use the public view that includes uploader name
    const { data, error } = await supabase
      .from('books_public' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Cast the data to Book type - view includes publisher_name from profiles
      const booksData = (data as any[]).map((book) => ({
        ...book,
        user_id: '', // Not exposed in public view for privacy
        status: 'approved', // Only approved books are in this view
      })) as Book[];
      setBooks(booksData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === null || book.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [books, searchQuery, selectedCategory]);

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsDetailModalOpen(true);
  };

  const handleReadBook = () => {
    if (selectedBook) {
      setReadingBook(selectedBook);
      setIsReading(true);
      setIsDetailModalOpen(false);
    }
  };

  const handleBackToLibrary = () => {
    setIsReading(false);
    setReadingBook(null);
  };

  if (isReading && readingBook) {
    return (
      <PDFReader
        fileUrl={readingBook.file_url}
        title={readingBook.title}
        bookId={readingBook.id}
        onBack={handleBackToLibrary}
      />
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getCategoryTitle = () => {
    if (selectedCategory) {
      const categoryName = selectedCategory.replace('-', ' ');
      return `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Books`;
    }
    return 'All Books';
  };

  return (
    <motion.div 
      className="min-h-screen bg-background relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Global animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-accent/5 to-transparent blur-3xl" />
      </div>

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10"
      >
        <Header 
          onUploadClick={() => setIsUploadModalOpen(true)} 
          onAdminClick={() => setIsAdminPanelOpen(true)}
          onUsersClick={() => setIsUserManagementOpen(true)}
          onMyUploadsClick={() => setIsMyUploadsOpen(true)}
          isAdmin={isAdmin}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        className="relative z-10"
      >
        <HeroSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          bookCount={books.length}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative z-10"
      >
        <CategoryFilterNew
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </motion.div>

      <main className="container mx-auto px-4 py-12 relative z-10">
        <motion.div 
          className="flex items-center justify-between mb-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="font-serif text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">{getCategoryTitle()}</span>
          </h2>
          <div className="glass-card px-4 py-2 rounded-xl">
            <p className="text-sm text-muted-foreground">
              {filteredBooks.length === 1 
                ? `${filteredBooks.length} book`
                : `${filteredBooks.length} books`}
            </p>
          </div>
        </motion.div>

        {loading ? (
          <motion.div 
            className="flex flex-col items-center justify-center py-20 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <div className="absolute inset-0 blur-lg bg-primary/30 rounded-full animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm">Loading your library...</p>
          </motion.div>
        ) : filteredBooks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <EmptyState
              hasSearch={searchQuery !== '' || selectedCategory !== null}
              onUploadClick={() => setIsUploadModalOpen(true)}
            />
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: Math.min(index * 0.06, 0.6),
                  ease: "easeOut" 
                }}
              >
                <BookCardNew
                  book={book}
                  onClick={() => handleBookClick(book)}
                  progress={progressMap[book.id] || null}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <motion.footer 
        className="glass border-t border-border/30 py-10 px-4 mt-auto relative z-10 overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1), hsl(var(--primary) / 0.1))",
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Floating elements */}
        <motion.div
          className="absolute top-4 left-[10%] text-primary/10"
          animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </motion.div>
        <motion.div
          className="absolute bottom-4 right-[15%] text-accent/10"
          animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </motion.div>

        <div className="container mx-auto flex flex-col items-center gap-6 relative z-10">
          <motion.div 
            className="text-center space-y-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <motion.p 
              className="text-lg font-serif gradient-text font-semibold"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 200%" }}
            >
              Read. Learn. Grow.
            </motion.p>
            <p className="text-muted-foreground text-sm">
              Your digital library awaits.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/about')}
              className="glass-button rounded-xl"
            >
              About Us
            </Button>
          </motion.div>
        </div>
      </motion.footer>

      <BookDetailModal
        book={selectedBook}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onRead={handleReadBook}
        onBookDeleted={fetchBooks}
      />

      <UploadBookModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchBooks}
      />

      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onBookUpdated={fetchBooks}
      />

      <UserManagement
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
      />

      <MyUploadsModal
        isOpen={isMyUploadsOpen}
        onClose={() => setIsMyUploadsOpen(false)}
        onBookDeleted={fetchBooks}
      />
    </motion.div>
  );
};

export default Index;
