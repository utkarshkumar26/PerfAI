"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Review, User } from "@prisma/client";
import type { EmployeeReviewInput, ReviewInput, UpdateReviewInput } from "../validations/review.schema";

export type ReviewWithUser = Review & {
  user: Pick<User, "id" | "name" | "avatarUrl">;
};

export type ReviewInputData = Partial<EmployeeReviewInput> & Record<string, unknown>;
export interface ReviewPage {
  items: ReviewWithUser[];
  nextCursor: string | null;
  hasMore: boolean;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export function useReviews(filters: { type?: string } = {}) {
  return useInfiniteQuery({
    queryKey: ["reviews", filters],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (filters.type) params.set("type", filters.type);
      if (pageParam) params.set("cursor", pageParam);
      return request<ReviewPage>(`/api/reviews?${params}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useManagerReviews() {
  return useInfiniteQuery({
    queryKey: ["reviews", "manager"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set("cursor", pageParam);
      return request<ReviewPage>(`/api/reviews?${params}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useCreateEmployeeReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (input: EmployeeReviewInput) =>
      request<ReviewWithUser>("/api/reviews", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { toast.success("Review submitted for manager review"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePolishReviewText() {
  return useMutation({
    mutationFn: (text: string) => request<{ text: string }>("/api/ai/review/polish", {
      method: "POST", body: JSON.stringify({ text }),
    }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReview(id: string) {
  return useQuery({
    queryKey: ["reviews", id],
    queryFn: () => request<ReviewWithUser>(`/api/reviews/${id}`),
    enabled: Boolean(id),
  });
}

function useInvalidateReviews() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["reviews"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useGenerateReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (input: ReviewInput) =>
      request<Review>("/api/ai/review", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      toast.success("Review generated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateReviewInput & { id: string }) =>
      request<Review>(`/api/reviews/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => {
      toast.success("Review updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (id: string) =>
      request<{ deleted: boolean }>(`/api/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Review deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
