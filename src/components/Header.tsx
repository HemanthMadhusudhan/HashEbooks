import { Upload, LogIn, Shield, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import hashebooksLogo from '@/assets/hashebooks-logo.webp';
import { ThemeToggle } from './ThemeToggle';
import { ProfileDropdown } from './ProfileDropdown';
import { motion } from 'framer-motion';

interface HeaderProps {
  onUploadClick: () => void;
  onAdminClick?: () => void;
  onUsersClick?: () => void;
  onMyUploadsClick?: () => void;
  isAdmin?: boolean;
}

export function Header({ onUploadClick, onAdminClick, onUsersClick, onMyUploadsClick, isAdmin }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.header 
      className="sticky top-0 z-50 glass border-b border-border/30 overflow-hidden"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/')}
          >
            <img src={hashebooksLogo} alt="HashEBooks" className="h-8 sm:h-11 w-auto relative z-10" />
            <div className="flex items-center gap-1">
              <h1 className="font-serif text-lg sm:text-2xl font-bold text-foreground">
                HashEBooks
              </h1>
            </div>
          </motion.div>

          <motion.div 
            className="flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ThemeToggle />
            
            {isAdmin && onAdminClick && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="secondary" 
                  onClick={onAdminClick} 
                  className="gap-2 glass-button rounded-xl"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Books</span>
                </Button>
              </motion.div>
            )}

            {isAdmin && onUsersClick && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="secondary" 
                  onClick={onUsersClick} 
                  className="gap-2 glass-button rounded-xl"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Users</span>
                </Button>
              </motion.div>
            )}
            
            {user && (
              <motion.div 
                whileHover={{ y: -2 }} 
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Button 
                  onClick={onUploadClick} 
                  className="relative gap-2 rounded-xl hover:opacity-90 shadow-sm transition-all duration-300"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload Book</span>
                </Button>
              </motion.div>
            )}
            
            {user ? (
              <ProfileDropdown onMyUploadsClick={onMyUploadsClick || (() => {})} />
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/auth')} 
                  className="gap-2 glass-button rounded-xl"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
