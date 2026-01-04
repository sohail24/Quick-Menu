// src/components/AdminRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../lib/api';

type Props = {
  children: React.ReactNode;
  /** allowed roles, default ['ADMIN'] */
  allowedRoles?: string[];
  /** where to redirect if unauthorized */
  redirectTo?: string;
};

/**
 * AdminRoute - protect routes for admin users.
 *
 * Usage:
 * <AdminRoute>
 *   <AdminPage />
 * </AdminRoute>
 *
 * Or for router:
 * <Route path="/admin/*" element={<AdminRoute><AdminLayout /></AdminRoute>} />
 */

export default function AdminRoute({
  children,
  allowedRoles = ['ADMIN'],
  redirectTo = '/login',
}: Props) {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;
    setChecking(true);

    api
      .get('/api/auth/me', { headers: { 'x-skip-401-redirect': '1' } })
      .then((res) => {
        if (!mounted) return;
        const me = res.data || {};
        // normalize possible role shapes
        // examples we handle: { role: 'ADMIN' }, { roles: ['ADMIN'] }, { authorities: ['ROLE_ADMIN'] }
        const singleRole = (me.role ?? me.authority ?? '') as string;
        const rolesArr: string[] =
          (Array.isArray(me.roles) && me.roles) ||
          (Array.isArray(me.authorities) && me.authorities) ||
          (typeof me.role === 'string' ? [me.role] : []) ||
          [];

        const normalized = new Set<string>();
        if (singleRole) normalized.add(String(singleRole).toUpperCase());
        for (const r of rolesArr) {
          normalized.add(String(r).toUpperCase());
        }

        const allowedUpper = allowedRoles.map((r) => r.toUpperCase());
        const isAllowed = allowedUpper.some((ar) => {
          // accept matches like ROLE_ADMIN or ADMIN
          return Array.from(normalized).some((nr) => nr.includes(ar));
        });

        setAuthorized(isAllowed);
      })
      .catch((err) => {
        console.warn('AdminRoute auth check failed:', err);
        setAuthorized(false);
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(allowedRoles)]);

  if (checking) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-sm text-gray-600">Checking access...</div>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
