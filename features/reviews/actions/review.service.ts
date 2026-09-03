import "server-only";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { User } from "@prisma/client";
import type {
  EmployeeReviewInput,
  ReviewInput,
  ReviewQuery,
  UpdateReviewInput,
} from "../validations/review.schema";

type ReviewComment = { id: string; authorName: string; text: string; createdAt: string };

export async function listReviews(user: User, query: ReviewQuery) {
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  const userId = isManager ? query.userId : user.id;

  const where = {
    ...(userId ? { userId } : isManager && user.role === "MANAGER" ? { user: { managerId: user.id } } : {}),
    ...(query.type ? { type: query.type } : {}),
  };

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
  return reviews.map((review) => sanitizeReview(user, review));
}

export async function getReview(user: User, id: string) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, avatarUrl: true, managerId: true } } },
  });
  if (!review) throw new ApiError(404, "Review not found");
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  if (isManager) assertManagerAccess(user, review.user);
  else if (review.userId !== user.id) {
    throw new ApiError(403, "You do not have access to this review");
  }
  return sanitizeReview(user, review);
}

function sanitizeReview(user: User, review: { rating: number | null; annualPerformance: string | null; overallPerformanceFeedback: string | null; finalAppraisal: string | null; incrementEligibility: string | null; performanceEligibility: string | null; [key: string]: unknown }) {
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  if (isManager) return review;
  const {
    rating,
    annualPerformance,
    overallPerformanceFeedback,
    finalAppraisal,
    incrementEligibility,
    performanceEligibility,
    ...employeeSafeReview
  } = review;
  return employeeSafeReview;
}

function assertManagerAccess(user: User, reviewUser: { managerId: string | null }) {
  if (user.role === "ADMIN") return;
  if (user.role !== "MANAGER" || reviewUser.managerId !== user.id) {
    throw new ApiError(403, "You do not have access to this employee review");
  }
}

async function notify(userId: string | null | undefined, title: string, message: string, reviewId: string) {
  if (!userId) return;
  await prisma.notification.create({
    data: { userId, type: "MANAGER_FEEDBACK", title, message, link: `/reviews/${reviewId}` },
  });
}

export async function createEmployeeReview(user: User, input: EmployeeReviewInput) {
  const review = await prisma.review.create({
    data: {
      period: input.period,
      type: input.type,
      input: JSON.parse(JSON.stringify(input)),
      content: "Employee-submitted review",
      strengths: [],
      weaknesses: [],
      growthAreas: [],
      status: "PENDING",
      submittedAt: new Date(),
      userId: user.id,
    },
    include: { user: { select: { id: true, name: true, avatarUrl: true, managerId: true } } },
  });
  try {
    await notify(
      review.user.managerId,
      "Review ready for approval",
      `${user.name} has submitted a ${input.type === "MID_YEAR" ? "Mid-Year" : "Final-Year"} Review for your approval.`,
      review.id
    );
  } catch (error) {
    console.error("[Review API] Manager notification failed", error);
  }
  return sanitizeReview(user, review);
}

export async function updateReview(user: User, id: string, input: UpdateReviewInput) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, managerId: true } } },
  });
  if (!review) throw new ApiError(404, "Review not found");
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  if (isManager) assertManagerAccess(user, review.user);
  else if (review.userId !== user.id) throw new ApiError(403, "You do not have permission to edit this review");

  if (input.action && !isManager && input.action !== "SUBMIT") {
    throw new ApiError(403, "Only managers can perform this review action");
  }
  if (input.action && isManager && !["APPROVE", "REJECT", "REQUEST_MODIFICATION", "COMMENT"].includes(input.action)) {
    throw new ApiError(400, "Invalid manager action");
  }

  let status = review.status;
  if (!isManager && input.action === "SUBMIT") status = "PENDING";
  if (input.action === "APPROVE") status = "APPROVED";
  if (input.action === "REJECT") status = "REJECTED";
  if (input.action === "REQUEST_MODIFICATION") status = "MODIFICATION_REQUIRED";
  const comments = Array.isArray(review.comments) ? [...(review.comments as ReviewComment[])] : [];
  if (input.comment?.trim()) {
    comments.push({ id: randomUUID(), authorName: user.name, text: input.comment.trim(), createdAt: new Date().toISOString() });
  }
  const employeeInput = input.employeeData ? JSON.parse(JSON.stringify(input.employeeData)) : undefined;
  const nextInput = employeeInput ? { ...(review.input as object), ...employeeInput } : undefined;
  const updated = await prisma.review.update({
    where: { id },
    data: {
      content: input.content ?? review.content,
      rating: isManager ? input.rating : review.rating,
      actionPlan: input.actionPlan ?? review.actionPlan,
      input: nextInput ?? undefined,
      status,
      submittedAt: status === "PENDING" ? new Date() : review.submittedAt,
      comments: comments as any,
      annualPerformance: isManager ? input.annualPerformance : review.annualPerformance,
      overallPerformanceFeedback: isManager ? input.overallPerformanceFeedback : review.overallPerformanceFeedback,
      finalAppraisal: isManager ? input.finalAppraisal : review.finalAppraisal,
      incrementEligibility: isManager ? input.incrementEligibility : review.incrementEligibility,
      performanceEligibility: isManager ? input.performanceEligibility : review.performanceEligibility,
    },
    include: { user: { select: { id: true, name: true, avatarUrl: true, managerId: true } } },
  });
  if (input.action === "SUBMIT") {
    await notify(review.user.managerId, "Review resubmitted", `${user.name} has resubmitted their ${review.type === "MID_YEAR" ? "Mid-Year" : "Final-Year"} Review after modification.`, id);
  } else if (input.action === "APPROVE") {
    await notify(review.userId, "Review approved", `Your ${review.type === "MID_YEAR" ? "Mid-Year" : "Final-Year"} Review has been approved by your manager.`, id);
  } else if (input.action === "REJECT") {
    await notify(review.userId, "Review rejected", `Your ${review.type === "MID_YEAR" ? "Mid-Year" : "Final-Year"} Review has been rejected. Please review the manager's comments.`, id);
  } else if (input.action === "REQUEST_MODIFICATION") {
    await notify(review.userId, "Review requires modification", `Your ${review.type === "MID_YEAR" ? "Mid-Year" : "Final-Year"} Review requires modification. Please review your manager's comments and resubmit.`, id);
  } else if (input.action === "COMMENT") {
    await notify(review.userId, "New review comment", "Your manager has added a comment to your review.", id);
  }
  return sanitizeReview(user, updated);
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
