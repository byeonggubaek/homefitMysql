import { useCallback, useEffect, useState } from "react";
import type { Member } from "shared";

export const useUserSession = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/member/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMember(data);
      } else {
        setMember(null);
      }
    } catch {
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { member, loading, refetch };
};