import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'user';

interface UserRole {
  role: AppRole;
}

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      try {
        const { data, error } = await (supabase
          .from('user_roles' as any)
          .select('role')
          .eq('user_id', user.id) as any);

        if (!error && data) {
          const roleData = data as UserRole[];
          setRoles(roleData.map((r) => r.role));
        }
      } catch (e) {
        console.error('Error fetching roles:', e);
      }
      setLoading(false);
    };

    fetchRoles();
  }, [user]);

  const isAdmin = roles.includes('admin');
  const isUser = roles.includes('user');

  return { roles, isAdmin, isUser, loading };
}
