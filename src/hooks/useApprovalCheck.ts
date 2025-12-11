import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function useApprovalCheck() {
  const navigate = useNavigate();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkApproval = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user has any role (approved)
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const approved = roles && roles.length > 0;
      setIsApproved(approved);
      setIsLoading(false);
    };

    checkApproval();
  }, [navigate]);

  return { isApproved, isLoading };
}
