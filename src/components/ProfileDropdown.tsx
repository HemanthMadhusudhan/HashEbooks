import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, BookOpen, LogOut, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface ProfileDropdownProps {
  onMyUploadsClick: () => void;
}

export function ProfileDropdown({ onMyUploadsClick }: ProfileDropdownProps) {
  const { user, signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // Fetch profile for display name
      supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.display_name) {
            setDisplayName(data.display_name);
          }
        });
    }
  }, [user?.id]);

  const handleLogout = async () => {
    await signOut();
    setShowLogoutDialog(false);
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getName = () => {
    return displayName || user?.email?.split('@')[0] || 'User';
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <motion.button
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Avatar className="h-8 w-8 border-2 border-primary/30">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate">
              {getName()}
            </span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </motion.button>
        </DropdownMenuTrigger>

        <AnimatePresence>
          {isOpen && (
            <DropdownMenuContent
              align="end"
              className="w-72 p-2 bg-card border border-border shadow-xl rounded-xl z-50"
              asChild
              forceMount
            >
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* Profile Header */}
                <div className="px-3 py-4 mb-2 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary/50 shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg font-semibold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {getName()}
                      </p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1" />

                {/* Menu Items */}
                <DropdownMenuItem
                  onClick={onMyUploadsClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/10 focus:bg-primary/10"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">My Uploads</p>
                    <p className="text-xs text-muted-foreground">View your uploaded books</p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  onClick={() => setShowLogoutDialog(true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-destructive/10 focus:bg-destructive/10 text-destructive"
                >
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Sign Out</p>
                    <p className="text-xs opacity-70">Log out of your account</p>
                  </div>
                </DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          )}
        </AnimatePresence>
      </DropdownMenu>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-destructive" />
              Sign Out
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to sign in again to access your uploads and reading progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}