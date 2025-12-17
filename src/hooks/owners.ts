import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL;

export type AdminOwner = {
  id: string;
  phone: string | null;
  createdAt: string;
  propertiesCount: number;
  user: {
    id: string;
    email: string;
    name: string | null;
    deletedAt: string | null;
  };
};

export type PaginatedResponse<T> = {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
};

export type OwnersListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Request failed');
  }
  return res.json();
}

export function useAdminOwnersList(params: OwnersListParams = {}) {
  const { search, page = 1, pageSize = 20 } = params;

  return useQuery<PaginatedResponse<AdminOwner>>({
    queryKey: ['admin-owners', { search, page, pageSize }],
    queryFn: () => {
      const sp = new URLSearchParams();
      sp.set('page', String(page));
      sp.set('pageSize', String(pageSize));
      if (search) sp.set('search', search);
      return apiFetch(`/admin/owners?${sp.toString()}`);
    },
  });
}
