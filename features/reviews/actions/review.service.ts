import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { User } from "@prisma/client";
import type { ReviewInput, ReviewQuery, UpdateReviewInput } from "../validations/review.schema";

export async function listReviews(user: User, query: ReviewQuery) {
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  const userId = isManager ? query.userId ?? user.id : user.id;

  const where = {
    userId,
    ...(query.type ? { type: query.type } : {}),
  };

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
  return reviews;
}

export async function getReview(user: User, id: string) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
  if (!review) throw new ApiError(404, "Review not found");
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  if (!isManager && review.userId !== user.id) {
    throw new ApiError(403, "You do not have access to this review");
  }
  return review;
}

export async function updateReview(user: User, id: string, input: UpdateReviewInput) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new ApiError(404, "Review not found");
  if (review.userId !== user.id) {
    throw new ApiError(403, "You do not have permission to edit this review");
  }

  return prisma.review.update({
    where: { id },
    data: {
      content: input.content,
      rating: input.rating,
      actionPlan: input.actionPlan,
    },
  });
}

export async function deleteReview(user: User, id: string) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new ApiError(404, "Review not found");
  if (review.userId !== user.id) {
    throw new ApiError(403, "You do not have permission to delete this review");
  }
  await prisma.review.delete({ where: { id } });
}

interface GeneratedReview {
  review: string;
  strengths: string[];
  weaknesses: string[];
  growthAreas: string[];
  rating: number;
  actionPlan: string;
}

export async function saveGeneratedReview(
  user: User,
  input: ReviewInput,
  generated: GeneratedReview
) {
  const review = await prisma.review.create({
    data: {
      period: input.period,
      type: input.type,
      input: JSON.parse(JSON.stringify(input)),
      content: generated.review,
      strengths: generated.strengths,
      weaknesses: generated.weaknesses,
      growthAreas: generated.growthAreas,
      actionPlan: generated.actionPlan,
      rating: Math.min(5, Math.max(1, generated.rating)),
      aiGenerated: true,
      userId: user.id,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "REVIEW_GENERATED",
      entity: "Review",
      entityId: review.id,
      metadata: { period: review.period, rating: review.rating },
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "REVIEW_READY",
      title: "Review ready",
      message: `Your AI performance review for ${review.period} is ready.`,
      link: `/reviews/${review.id}`,
    },
  });

  return review;
}
