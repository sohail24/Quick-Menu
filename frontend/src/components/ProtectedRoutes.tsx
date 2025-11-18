// src/components/ProtectedRoute.tsx
import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../app/store';

type Props = {
  children: JSX.Element;
  roles?: string[]; // optional list of roles allowed
};

export default function ProtectedRoute({ children, roles }: Props) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0) {
    // Support both 'roles' array and 'role' string
    const userRoles = ((user as any)?.roles as string[]) || [];
    const userRole = (user as any)?.role as string | undefined;
    const ok = roles.some(
      (r) =>
        userRoles.includes(r) ||
        userRoles.includes(`ROLE_${r}`) ||
        userRole === r ||
        userRole === `ROLE_${r}`,
    );
    if (!ok) return <Navigate to="/" replace />;
  }

  return children;
}
