// src/components/PublicOnlyRoute.tsx
import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../app/store';

type Props = {
  children: JSX.Element;
};

export default function PublicOnlyRoute({ children }: Props) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (token) {
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN' || user?.roles?.includes('ADMIN') || user?.roles?.includes('ROLE_ADMIN');
    const dashboardPath = isAdmin ? '/admin' : '/staff';
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
}
