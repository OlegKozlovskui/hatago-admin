import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL;

export type UserRole = 'USER' | 'OWNER' | 'ADMIN';

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  roles: UserRole[];
  createdAt: string;
  lastLoginAt: string | null;
  deletedAt: string | null;

  isOwner: boolean;
  propertiesCount: number;
  leadsCount: number;
};

export type PaginatedResponse<T> = {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
};

export type UsersListParams = {
  search?: string;
  role?: UserRole;
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
};

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Request failed');
  }

  return res.json();
}

export function useAdminUsersList(params: UsersListParams = {}) {
  const { search, role, includeDeleted, page = 1, pageSize = 20 } = params;

  return useQuery<PaginatedResponse<AdminUser>>({
    queryKey: ['admin-users', { search, role, includeDeleted, page, pageSize }],
    queryFn: () => {
      const sp = new URLSearchParams();
      sp.set('page', String(page));
      sp.set('pageSize', String(pageSize));
      if (search) sp.set('search', search);
      if (role) sp.set('role', role);
      if (includeDeleted) sp.set('includeDeleted', 'true');

      return apiFetch<PaginatedResponse<AdminUser>>(`/admin/users?${sp.toString()}`);
    },
  });
}

export function useSoftDeleteUser() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) =>
      apiFetch<{ success: boolean }>(`/admin/users/${id}/soft-delete`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useRestoreUser() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) =>
      apiFetch<{ success: boolean }>(`/admin/users/${id}/restore`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}
