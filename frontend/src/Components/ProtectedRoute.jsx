import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';

export default function ProtectedRoute({ children }) {
  const { user, token } = useSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && (!user || !token)) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, token, isMounted, router, pathname]);

  if (!isMounted || !user || !token) {
    return <div className="flex h-screen w-full items-center justify-center bg-brand-dark-bg text-white">Loading...</div>;
  }

  return children;
}
