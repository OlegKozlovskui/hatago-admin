import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = 'http://localhost:3000'; // TODO: винести в .env

export type Amenity = {
  id: string;
  code: string;
  label: string;
  props: Record<string, never> | null;
};

export type PaginatedResponse<T> = {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
};

export type AmenityListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include', // важливо для cookie (JWT)
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

// ---- LIST ----
export function useAmenitiesList(params: AmenityListParams = {}) {
  const { search, page = 1, pageSize = 20 } = params;

  return useQuery<PaginatedResponse<Amenity>>({
    queryKey: ['amenities', { search, page, pageSize }],
    queryFn: () => {
      const sp = new URLSearchParams();
      sp.set('page', String(page));
      sp.set('pageSize', String(pageSize));
      if (search) sp.set('search', search);

      return apiFetch<PaginatedResponse<Amenity>>(
        `/amenities?${sp.toString()}`,
      );
    },
  });
}

// ---- CREATE ----
type CreateAmenityInput = {
  code: string;
  label: string;
  props?: Record<string, never>;
};

export function useCreateAmenity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAmenityInput) =>
      apiFetch<Amenity>('/amenities', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amenities'] });
    },
  });
}

// ---- UPDATE ----
type UpdateAmenityInput = {
  id: string;
  data: {
    code?: string;
    label?: string;
    props?: Record<string, any> | null;
  };
};

export function useUpdateAmenity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateAmenityInput) =>
      apiFetch<Amenity>(`/amenities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amenities'] });
    },
  });
}

// ---- DELETE ----
export function useDeleteAmenity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/amenities/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amenities'] });
    },
  });
}
