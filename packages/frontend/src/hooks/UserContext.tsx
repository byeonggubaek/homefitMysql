// contexts/UserContext.tsx
import { createContext, useContext, type ReactNode } from 'react';  // ✅ type 키워드 추가
import { useUserSession } from '@/hooks/useUserSession';
import type { Member } from 'shared';

interface UserContextType {
  member: Member | null;
  loading: boolean;
  refetch: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {  // 이제 에러 없음
  const { member, loading, refetch } = useUserSession();
  
  return (
    <UserContext.Provider value={{ member, loading, refetch }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};