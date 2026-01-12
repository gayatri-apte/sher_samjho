import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../services/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsub;
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    loading,
  };
}
