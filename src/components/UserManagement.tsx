import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Trash2, Search, Users, Loader2, ShieldCheck, User } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string | null;
  roles: string[];
}

export function UserManagement({ isOpen, onClose }: UserManagementProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteUser, setDeleteUser] = useState<UserProfile | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    // Fetch all roles
    const { data: roles, error: rolesError } = await (supabase
      .from('user_roles' as any)
      .select('user_id, role') as any);

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    // Combine profiles with roles
    const usersWithRoles: UserProfile[] = (profiles || []).map((profile) => {
      const userRoles = (roles || [])
        .filter((r: any) => r.user_id === profile.id)
        .map((r: any) => r.role);
      
      return {
        ...profile,
        roles: userRoles,
      };
    });

    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (!deleteUser || !adminPassword) return;

    setDeleting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('delete-user', {
        body: { userId: deleteUser.id, adminPassword },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete user');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'User deleted',
        description: `${deleteUser.email || deleteUser.display_name || 'User'} has been removed.`,
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Unable to delete user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteUser(null);
      setAdminPassword('');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              User Management
            </DialogTitle>
            <DialogDescription>
              View and manage all registered users. Delete users and their content.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No users found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.roles.includes('admin') ? (
                            <ShieldCheck className="w-4 h-4 text-primary" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                          {user.display_name || 'No name'}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || 'No email'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={role === 'admin' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteUser(user)}
                          disabled={user.roles.includes('admin')}
                          title={user.roles.includes('admin') ? 'Cannot delete admin users' : 'Delete user'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredUsers.length} user{filteredUsers.length !== 1 && 's'} total
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation with Password */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => {
        setDeleteUser(null);
        setAdminPassword('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to delete <strong>{deleteUser?.email || deleteUser?.display_name}</strong>? 
                This will permanently remove:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>User account and profile</li>
                <li>All books uploaded by this user</li>
                <li>Reading progress data</li>
              </ul>
              <p className="text-destructive font-medium">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2 py-2">
            <Label htmlFor="admin-password">Enter your admin password to confirm</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Your password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteUser(null);
                setAdminPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!adminPassword || deleting}
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete User
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
