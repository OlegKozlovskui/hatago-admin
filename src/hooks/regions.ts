// src/hooks/regions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = 'http://localhost:3000'; // TODO: .env

export type RegionWhatToExpectItem = {
  title: string;
  body: string;
};

export type RegionFaqItem = {
  question: string;
  answer: string;
};

export type RegionCtaStat = {
  label: string;
  caption: string;
};

export type Region = {
  id: string;
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  description: string;

  coverImagePath: string | null;
  heroImagePath: string | null;

  tags: string[];

  whatToExpectTitle: string;
  whatToExpectIntro: string;
  whatToExpectItems: RegionWhatToExpectItem[] | null;

  faq: RegionFaqItem[] | null;

  quickLinksTipTitle: string | null;
  quickLinksTipText: string | null;

  ctaTitle: string | null;
  ctaText: string | null;
  ctaButtonLabel: string | null;
  ctaButtonUrl: string | null;
  ctaStats: RegionCtaStat[] | null;

  createdAt: string;
  updatedAt: string;
};

export type PaginatedResponse<T> = {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
};

export type RegionListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData
        ? {} // браузер сам виставить boundary
        : { 'Content-Type': 'application/json' }),
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
export function useRegionsList(params: RegionListParams = {}) {
  const { search, page = 1, pageSize = 20 } = params;

  return useQuery<PaginatedResponse<Region>>({
    queryKey: ['regions', { search, page, pageSize }],
    queryFn: () => {
      const sp = new URLSearchParams();
      sp.set('page', String(page));
      sp.set('pageSize', String(pageSize));
      if (search) sp.set('search', search);

      return apiFetch<PaginatedResponse<Region>>(
        `/regions?${sp.toString()}`,
      );
    },
  });
}

// ---- CREATE / UPDATE ----
export type CreateRegionInput = {
  name: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  tags?: string[];

  whatToExpectTitle?: string;
  whatToExpectIntro: string;
  whatToExpectItems?: RegionWhatToExpectItem[];

  faq?: RegionFaqItem[];

  quickLinksTipTitle?: string | null;
  quickLinksTipText?: string | null;

  ctaTitle?: string | null;
  ctaText?: string | null;
  ctaButtonLabel?: string | null;
  ctaButtonUrl?: string | null;
  ctaStats?: RegionCtaStat[];
};

export function useCreateRegion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRegionInput) =>
      apiFetch<Region>('/regions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regions'] });
    },
  });
}

export type UpdateRegionInput = {
  id: string;
  data: Partial<CreateRegionInput>;
};

export function useUpdateRegion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateRegionInput) =>
      apiFetch<Region>(`/regions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['regions'] });
      qc.invalidateQueries({ queryKey: ['region', variables.id] });
    },
  });
}

// ---- DELETE ----
export function useDeleteRegion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/regions/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regions'] });
    },
  });
}

// ---- UPLOAD IMAGES ----
type UploadRegionImageInput = {
  id: string;
  file: File;
};

type UploadRegionImageResponse = {
  path: string;
};

function uploadImage(
  kind: 'cover' | 'hero',
  { id, file }: UploadRegionImageInput,
) {
  const formData = new FormData();
  formData.append('file', file);

  const endpoint =
    kind === 'cover'
      ? `/regions/${id}/cover-image`
      : `/regions/${id}/hero-image`;

  return apiFetch<UploadRegionImageResponse>(endpoint, {
    method: 'POST',
    body: formData,
  });
}

export function useUploadCoverImage() {
  return useMutation({
    mutationFn: (input: UploadRegionImageInput) =>
      uploadImage('cover', input),
  });
}

export function useUploadHeroImage() {
  return useMutation({
    mutationFn: (input: UploadRegionImageInput) =>
      uploadImage('hero', input),
  });
}
