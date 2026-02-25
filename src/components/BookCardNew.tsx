import { Book } from '@/types/book';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, BookOpen, Upload, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface BookCardNewProps {
  book: Book;
  onClick: () => void;
  progress?: {
    current_page: number;
    total_pages: number | null;
  } | null;
}

export function BookCardNew({ book, onClick, progress }: BookCardNewProps) {
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

  const progressPercent = progress?.total_pages
    ? Math.round((progress.current_page / progress.total_pages) * 100)
    : null;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative glass-card rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-foreground/5 hover:-translate-y-1">
        {/* Inner content container */}
        <div className="relative bg-card rounded-2xl overflow-hidden">

          <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
            {book.cover_url ? (
              <motion.img
                src={book.cover_url}
                alt={book.title}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                <div className="text-center space-y-3">
                  <motion.div
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <BookOpen className="w-14 h-14 mx-auto text-primary/50 transition-all duration-500 group-hover:text-primary/70" />
                  </motion.div>
                  <motion.span
                    className="text-4xl inline-block"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {categoryIcons[book.category] || '📚'}
                  </motion.span>
                </div>
              </div>
            )}

            <motion.div
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              className="absolute top-3 right-3"
            >
              <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-lg transition-all duration-300 group-hover:bg-primary group-hover:shadow-xl rounded-lg">
                <FileText className="w-3 h-3 mr-1" />
                {book.file_type.toUpperCase()}
              </Badge>
            </motion.div>

            {progressPercent !== null && progressPercent > 0 && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="absolute top-3 left-3"
              >
                <Badge
                  variant="secondary"
                  className="bg-green-500/90 backdrop-blur-sm text-white shadow-lg transition-all duration-300 group-hover:scale-105 rounded-lg"
                >
                  <motion.span
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {progressPercent}% read
                  </motion.span>
                </Badge>
              </motion.div>
            )}

            {/* Hover overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out"
            />

            {/* Slide-up content on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-all duration-500 ease-out">
              <p className="text-foreground text-sm line-clamp-2 font-medium">
                {progress?.current_page && progress?.total_pages
                  ? `Continue from page ${progress.current_page} of ${progress.total_pages}`
                  : book.description || 'Click to start reading'}
              </p>
            </div>

            {progressPercent !== null && progressPercent > 0 && (
              <div className="absolute bottom-0 left-0 right-0">
                <Progress value={progressPercent} className="h-1.5 rounded-none bg-background/30" />
              </div>
            )}
          </div>

          <div className="p-4 space-y-2.5 relative">
            <motion.h3
              className="font-serif font-semibold text-foreground line-clamp-2 transition-all duration-300 group-hover:text-primary"
            >
              {book.title}
            </motion.h3>
            <p className="text-sm text-muted-foreground transition-all duration-300 group-hover:text-muted-foreground/80">
              {book.author}
            </p>
            <div className="flex items-center justify-between pt-1">
              <motion.span
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full glass-button capitalize"
                whileHover={{ scale: 1.05 }}
              >
                <span>{categoryIcons[book.category] || '📚'}</span>
                {book.category.replace('-', ' ')}
              </motion.span>
            </div>
            {book.publisher_name && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 pt-1">
                <Upload className="w-3 h-3" />
                <span>by {book.publisher_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
