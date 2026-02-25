import { Search, BookOpen, Sparkles, BookMarked, Library } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { readingThoughts } from '@/data/readingThoughts';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  bookCount: number;
}

export function HeroSection({ searchQuery, onSearchChange, bookCount }: HeroSectionProps) {
  const [currentThoughtIndex, setCurrentThoughtIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentThoughtIndex((prev) => (prev + 1) % readingThoughts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentThought = readingThoughts[currentThoughtIndex];

  return (
    <section className="relative py-16 sm:py-20 px-4 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/30"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, i % 2 === 0 ? 20 : -20, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Floating icons */}
      <motion.div
        className="absolute top-20 left-[5%] text-primary/20"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 10, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <BookMarked className="w-12 h-12" />
      </motion.div>
      <motion.div
        className="absolute bottom-32 right-[8%] text-accent/20"
        animate={{
          y: [0, 20, 0],
          rotate: [0, -15, 0],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <Library className="w-16 h-16" />
      </motion.div>
      
      {/* Floating glass orbs with enhanced animations */}
      <motion.div 
        className="absolute top-10 left-[10%] w-72 h-72 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-3xl"
        animate={{ 
          x: [0, 40, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ 
          duration: 12, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      <motion.div 
        className="absolute bottom-10 right-[15%] w-96 h-96 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 blur-3xl"
        animate={{ 
          x: [0, -30, 0],
          y: [0, 40, 0],
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 2
        }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-primary/10 to-transparent blur-3xl opacity-50"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />

      {/* Additional animated ring */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/10"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <div className="container mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-muted-foreground mb-4"
            animate={{
              boxShadow: [
                "0 0 20px hsl(var(--primary) / 0.1)",
                "0 0 40px hsl(var(--primary) / 0.2)",
                "0 0 20px hsl(var(--primary) / 0.1)",
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            <span>Your digital library awaits</span>
          </motion.div>
          
          <div className="h-[100px] sm:h-[120px] md:h-[150px] flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.h2 
                key={currentThoughtIndex}
                className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <motion.span 
                  className="gradient-text block"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                >
                  {currentThought.title}
                </motion.span>
                <span className="text-foreground">{currentThought.subtitle}</span>
              </motion.h2>
            </AnimatePresence>
          </div>

          {/* Progress dots for thoughts */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {readingThoughts.map((_, index) => (
              <motion.button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentThoughtIndex 
                    ? 'bg-primary w-6' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                onClick={() => setCurrentThoughtIndex(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </motion.div>
        
        <motion.p 
          className="text-muted-foreground text-base md:text-lg mt-4 mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          Explore our curated collection of books across various categories
        </motion.p>
        
        <motion.div 
          className="w-full max-w-2xl mx-auto px-4 sm:px-0"
          initial={{ opacity: 0, y: 25, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <div className="relative group">
            <motion.div 
              className="absolute -inset-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 rounded-2xl blur-lg opacity-40 group-focus-within:opacity-70 transition-all duration-500"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 200%" }}
            />
            <div className="relative glass rounded-2xl p-1">
              <div className="relative flex items-center">
                <motion.div
                  className="absolute left-5 z-10"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Search className="w-5 h-5 text-primary transition-all duration-300 group-focus-within:scale-110" />
                </motion.div>
                <Input
                  type="text"
                  placeholder="Search books, authors, or categories..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-14 pr-6 h-16 text-lg rounded-xl border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                />
                <motion.div
                  className="absolute right-5"
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <BookOpen className="w-5 h-5 text-muted-foreground/40 transition-all duration-300 group-focus-within:text-primary/60" />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-6 flex items-center justify-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.div 
            className="glass-card px-6 py-3 rounded-xl cursor-default"
            whileHover={{ scale: 1.05, y: -2 }}
            animate={{
              boxShadow: [
                "0 0 0 hsl(var(--primary) / 0)",
                "0 0 30px hsl(var(--primary) / 0.2)",
                "0 0 0 hsl(var(--primary) / 0)",
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.p 
              className="text-2xl font-bold gradient-text"
              key={bookCount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {bookCount}
            </motion.p>
            <p className="text-xs text-muted-foreground">Books Available</p>
          </motion.div>
          <motion.div 
            className="glass-card px-6 py-3 rounded-xl cursor-default"
            whileHover={{ scale: 1.05, y: -2 }}
            animate={{
              boxShadow: [
                "0 0 0 hsl(var(--accent) / 0)",
                "0 0 30px hsl(var(--accent) / 0.2)",
                "0 0 0 hsl(var(--accent) / 0)",
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          >
            <motion.p 
              className="text-2xl font-bold gradient-text"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              ∞
            </motion.p>
            <p className="text-xs text-muted-foreground">Free to Read</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
