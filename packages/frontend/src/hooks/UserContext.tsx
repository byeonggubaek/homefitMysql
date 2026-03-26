// contexts/UserContext.tsx
import { createContext, useContext, type ReactNode } from 'react';  
import { useUserSession } from '@/hooks/useUserSession';
import type { Member } from 'shared';

interface UserContextType {
  member: Member | null;
  loading: boolean;
  refetch: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {  
  const { member, loading, refetch } = useUserSession();
  
  return (
    <UserContext.Provider value={{ member, loading, refetch }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser 는 UserProvider 내에서만 사용되어야 합니다');
  return context;
};