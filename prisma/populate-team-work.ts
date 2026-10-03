import { createHash } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { GoalStatus, PrismaClient, Priority, Role } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const applyChanges = process.argv.includes("--apply");
const allowRemote = process.argv.includes("--allow-remote");
const reviewPeriod = String(new Date().getFullYear());

type Workstream = {
  project: string;
  tasks: {
    title: string;
    description: string;
    priority: Priority;
    status: GoalStatus;
    progress: number;
    startDate: Date;
    dueDate: Date;
  }[];
  review: {
    rewards: string;
    certifications: string;
    bugsResolved: number;
    featuresEnhanced: number;
    achievedPoint1: string;
    achievedPoint2: string;
    learnedPoint1: string;
    learnedPoint2: string;
  };
};

const workstreams: Record<string, Workstream> = {
  quality: {
    project: "Build People",
    tasks: [
      {
        title: "Expand regression coverage for employee task workflows",
        description:
          "Add stable end-to-end coverage for task assignment, status updates, and review handoff. Include representative permission and validation cases.",
        priority: "MEDIUM",
        status: "COMPLETED",
        progress: 100,
        startDate: new Date("2026-08-24"),
        dueDate: new Date("2026-09-11"),
      },
      {
        title: "Investigate intermittent failures in the profile test suite",
        description:
          "Reproduce the intermittent profile-save failures in CI, identify timing-sensitive setup, and update the fixtures so failures are actionable.",
        priority: "HIGH",
        status: "IN_PROGRESS",
        progress: 60,
        startDate: new Date("2026-09-21"),
        dueDate: new Date("2026-10-16"),
      },
      {
        title: "Add API validation coverage for manager review actions",
        description:
          "Cover invalid review transitions, missing comments, and employee access boundaries in the manager review API tests.",
        priority: "MEDIUM",
        status: "TODO",
        progress: 0,
        startDate: new Date("2026-10-05"),
        dueDate: new Date("2026-10-23"),
      },
    ],
    review: {
      rewards: "",
      certifications: "",
      bugsResolved: 6,
      featuresEnhanced: 1,
      achievedPoint1:
        "Completed regression coverage for the core employee task workflow, including assignment and status changes.",
      achievedPoint2:
        "Improved CI failure investigation by narrowing intermittent profile-save failures to reproducible test cases.",
      learnedPoint1:
        "Applied more reliable fixture isolation to reduce timing-related test instability.",
      learnedPoint2:
        "Strengthened API testing practices around role-based access and review state transitions.",
    },
  },
  frontend: {
    project: "Build People",
    tasks: [
      {
        title: "Improve keyboard navigation in task detail and edit flows",
        description:
          "Ensure task details and edit actions can be completed with keyboard navigation, with visible focus and sensible focus return.",
        priority: "MEDIUM",
        status: "COMPLETED",
        progress: 100,
        startDate: new Date("2026-08-24"),
        dueDate: new Date("2026-09-11"),
      },
      {
        title: "Refine loading and empty states across team task views",
        description:
          "Align skeleton, empty, and error states across list views and confirm that filtering does not cause layout shifts.",
        priority: "HIGH",
        status: "IN_PROGRESS",
        progress: 60,
        startDate: new Date("2026-09-21"),
        dueDate: new Date("2026-10-16"),
      },
      {
        title: "Add component tests for task filters and status badges",
        description:
          "Verify filter selection, status labels, and responsive toolbar behavior with focused component tests.",
        priority: "MEDIUM",
        status: "TODO",
        progress: 0,
        startDate: new Date("2026-10-05"),
        dueDate: new Date("2026-10-23"),
      },
    ],
    review: {
      rewards: "",
      certifications: "",
      bugsResolved: 4,
      featuresEnhanced: 2,
      achievedPoint1:
        "Completed keyboard-navigation improvements in the task detail flow, including visible focus and reliable focus return.",
      achievedPoint2:
        "Improved task-view consistency by consolidating loading and empty-state behavior across the team workspace.",
      learnedPoint1:
        "Used accessibility checks earlier in component implementation to catch interaction gaps before review.",
      learnedPoint2:
        "Improved confidence in UI changes by adding focused tests for filters and status presentation.",
    },
  },
  backend: {
    project: "Build People",
    tasks: [
      {
        title: "Reduce repeated lookups in the team task summary endpoint",
        description:
          "Review the team task summary query plan and batch related lookups while preserving current authorization and response behavior.",
        priority: "HIGH",
        status: "COMPLETED",
        progress: 100,
        startDate: new Date("2026-08-24"),
        dueDate: new Date("2026-09-11"),
      },
      {
        title: "Harden retry handling for review notification delivery",
        description:
          "Make notification delivery failures observable and safe to retry without sending duplicate manager review alerts.",
        priority: "HIGH",
        status: "IN_PROGRESS",
        progress: 60,
        startDate: new Date("2026-09-21"),
        dueDate: new Date("2026-10-16"),
      },
      {
        title: "Add request validation tests for task assignment APIs",
        description:
          "Cover invalid assignees, missing required fields, and role boundaries for task creation and reassignment.",
        priority: "MEDIUM",
        status: "TODO",
        progress: 0,
        startDate: new Date("2026-10-05"),
        dueDate: new Date("2026-10-23"),
      },
    ],
    review: {
      rewards: "",
      certifications: "",
      bugsResolved: 5,
      featuresEnhanced: 2,
      achievedPoint1:
        "Completed a query-path review for the team task summary and removed repeated lookups without changing its response contract.",
      achievedPoint2:
        "Improved review-notification reliability by documenting retry behavior and adding observable failure handling.",
      learnedPoint1:
        "Deepened practical experience with query-plan analysis and batching related database reads.",
      learnedPoint2:
        "Improved service reliability by considering idempotency and observability together when designing retries.",
    },
  },
  platform: {
    project: "Build People",
    tasks: [
      {
        title: "Document the deployment health-check and rollback sequence",
        description:
          "Update the service runbook with health-check expectations, rollback steps, and ownership for the task and review services.",
        priority: "MEDIUM",
        status: "COMPLETED",
        progress: 100,
        startDate: new Date("2026-08-24"),
        dueDate: new Date("2026-09-11"),
      },
      {
        title: "Improve alert context for API latency regressions",
        description:
          "Add service and environment context to latency alerts and verify that the threshold avoids noisy notifications during deploys.",
        priority: "HIGH",
        status: "IN_PROGRESS",
        progress: 60,
        startDate: new Date("2026-09-21"),
        dueDate: new Date("2026-10-16"),
      },
      {
        title: "Review backup and restore checks for the application database",
        description:
          "Confirm scheduled backup visibility and document a repeatable restore validation for the staging environment.",
        priority: "MEDIUM",
        status: "TODO",
        progress: 0,
        startDate: new Date("2026-10-05"),
        dueDate: new Date("2026-10-23"),
      },
    ],
    review: {
      rewards: "",
      certifications: "",
      bugsResolved: 2,
      featuresEnhanced: 2,
      achievedPoint1:
        "Updated the deployment runbook with health-check expectations and a clear rollback sequence for the application services.",
      achievedPoint2:
        "Improved the context available during API latency investigations and continued tuning alert behavior.",
      learnedPoint1:
        "Strengthened operational readiness by validating runbook steps against the staging environment.",
      learnedPoint2:
        "Improved alert design by balancing useful deployment context with manageable notification volume.",
    },
  },
  fullstack: {
    project: "Build People",
    tasks: [
      {
        title: "Streamline task assignment validation and feedback",
        description:
          "Make assignment validation consistent between the task form and API, and provide clear feedback for invalid team members.",
        priority: "MEDIUM",
        status: "COMPLETED",
        progress: 100,
        startDate: new Date("2026-08-24"),
        dueDate: new Date("2026-09-11"),
      },
      {
        title: "Improve review queue handling for employee submissions",
        description:
          "Review the employee submission path through manager notifications and address gaps in loading and error handling.",
        priority: "HIGH",
        status: "IN_PROGRESS",
        progress: 60,
        startDate: new Date("2026-09-21"),
        dueDate: new Date("2026-10-16"),
      },
      {
        title: "Add integration coverage for task and review permissions",
        description:
          "Add integration cases confirming employees see their own work and managers can review submissions from their reports.",
        priority: "MEDIUM",
        status: "TODO",
        progress: 0,
        startDate: new Date("2026-10-05"),
        dueDate: new Date("2026-10-23"),
      },
    ],
    review: {
      rewards: "",
      certifications: "",
      bugsResolved: 4,
      featuresEnhanced: 2,
      achievedPoint1:
        "Completed improvements to task assignment validation and aligned feedback across the form and API.",
      achievedPoint2:
        "Improved the review submission flow by identifying loading and error-handling gaps across the employee and manager views.",
      learnedPoint1:
        "Improved end-to-end feature delivery by tracing behavior across UI, API, and notification boundaries.",
      learnedPoint2:
        "Applied authorization checks more consistently when designing integration coverage for manager workflows.",
    },
  },
};

function selectWorkstream(designation: string | null): Workstream {
  const role = designation?.toLowerCase() ?? "";
  if (role.includes("qa") || role.includes("test")) return workstreams.quality;
  if (role.includes("devops") || role.includes("platform") || role.includes("sre")) {
    return workstreams.platform;
  }
  if (role.includes("front") || role.includes("ui")) return workstreams.frontend;
  if (role.includes("back") || role.includes("database") || role.includes("api")) {
    return workstreams.backend;
  }
  if (role.includes("full")) return workstreams.fullstack;
  return workstreams.fullstack;
}

function taskNumberFor(userId: string, index: number) {
  const digest = createHash("sha256").update(`${userId}:team-work:${index}`).digest("hex");
  const numericId = Number.parseInt(digest.slice(0, 8), 16) % 1_000_000_000;
  return `T${String(numericId).padStart(9, "0")}`;
}

function isLocalDatabase(url: string) {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".localhost");
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured; no records were changed.");
  }
  if (!isLocalDatabase(databaseUrl) && applyChanges && !allowRemote) {
    throw new Error(
      "The configured database is non-local. Re-run with --allow-remote only if you intend to change that database."
    );
  }

  const employees = await prisma.user.findMany({
    where: { role: Role.EMPLOYEE },
    select: {
      id: true,
      name: true,
      designation: true,
      managerId: true,
      manager: { select: { id: true, name: true, role: true } },
    },
    orderBy: { name: "asc" },
  });
  const managers = await prisma.user.findMany({
    where: { role: { in: [Role.MANAGER, Role.ADMIN] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  if (employees.length === 0) {
    throw new Error("No employee accounts were found; no records were changed.");
  }

  const managerless = employees.filter(
    (employee) => !employee.manager || !["MANAGER", "ADMIN"].includes(employee.manager.role)
  );
  const defaultApprover = managerless.length > 0 && managers.length === 1 ? managers[0] : null;
  if (managerless.length > 0 && !defaultApprover) {
    throw new Error(
      `Database: ${isLocalDatabase(databaseUrl) ? "local" : "non-local"}. ` +
        `Employees without a manager: ${managerless.map((employee) => employee.name).join(", ")}. ` +
        `Available approvers: ${managers.map((manager) => `${manager.name} (${manager.role})`).join(", ") || "none"}. ` +
        "No records were changed."
    );
  }

  let tasksCreated = 0;
  let reviewsCreated = 0;
  let reviewsAlreadyPresent = 0;
  let managerLinksCreated = 0;
  const existingReviewDetails: { employee: string; status: string }[] = [];

  for (const employee of employees) {
    const managerId = employee.manager?.id ?? defaultApprover?.id;
    const managerName = employee.manager?.name ?? defaultApprover?.name;
    if (!managerId || !managerName) {
      throw new Error(`Cannot determine a manager for ${employee.name}; no records were changed.`);
    }
    if (!employee.managerId) {
      if (applyChanges) {
        await prisma.user.update({
          where: { id: employee.id },
          data: { managerId },
        });
      }
      managerLinksCreated += 1;
    }

    const workstream = selectWorkstream(employee.designation);
    for (const [index, task] of workstream.tasks.entries()) {
      const taskNumber = taskNumberFor(employee.id, index);
      const existing = await prisma.goal.findFirst({
        where: { taskNumber, userId: employee.id },
        select: { id: true },
      });
      if (existing) continue;
      if (!applyChanges) {
        tasksCreated += 1;
        continue;
      }

      const created = await prisma.goal.create({
        data: {
          taskNumber,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          progress: task.progress,
          approved: true,
          category: "Engineering",
          section: task.status === "TODO" ? "LATER" : "ASSIGNED",
          project: workstream.project,
          size: task.status === "COMPLETED" ? "M" : "L",
          sprint: "Sprint 45",
          owningTeam: "Build People",
          startDate: task.startDate,
          dueDate: task.dueDate,
          userId: employee.id,
          assignedById: managerId,
        },
      });
      await prisma.activityLog.create({
        data: {
          userId: managerId,
          action: "TASK_CREATED",
          entity: "Goal",
          entityId: created.id,
          metadata: { title: created.title, taskNumber },
        },
      });
      await prisma.notification.create({
        data: {
          userId: employee.id,
          type: "MANAGER_FEEDBACK",
          title: "New task assigned",
          message: `${managerName} assigned you the task "${created.title}"`,
          link: "/tasks",
        },
      });
      tasksCreated += 1;
    }

    const existingReview = await prisma.review.findFirst({
      where: { userId: employee.id, type: "FINAL_YEAR", period: reviewPeriod },
      select: { id: true, status: true },
    });
    if (existingReview) {
      reviewsAlreadyPresent += 1;
      existingReviewDetails.push({ employee: employee.name, status: existingReview.status });
      continue;
    }
    if (!applyChanges) {
      reviewsCreated += 1;
      continue;
    }

    const review = await prisma.review.create({
      data: {
        period: reviewPeriod,
        type: "FINAL_YEAR",
        input: {
          type: "FINAL_YEAR",
          period: reviewPeriod,
          ...workstream.review,
        },
        content: "Employee-submitted review",
        strengths: [],
        weaknesses: [],
        growthAreas: [],
        status: "PENDING",
        submittedAt: new Date(),
        userId: employee.id,
      },
    });
    await prisma.notification.create({
      data: {
        userId: managerId,
        type: "MANAGER_FEEDBACK",
        title: "Review ready for approval",
        message: `${employee.name} has submitted a Final-Year Review for your approval.`,
        link: `/reviews/${review.id}`,
      },
    });
    reviewsCreated += 1;
  }

  let verifiedTaskCount = 0;
  const verifiedTaskStatuses: Record<GoalStatus, number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    BLOCKED: 0,
    COMPLETED: 0,
  };
  let verifiedPendingReviews = 0;
  if (applyChanges) {
    const expectedTasks = employees.flatMap((employee) =>
      selectWorkstream(employee.designation).tasks.map((_, index) => ({
        userId: employee.id,
        taskNumber: taskNumberFor(employee.id, index),
      }))
    );
    const savedTasks = await prisma.goal.findMany({
      where: { OR: expectedTasks },
      select: { userId: true, taskNumber: true, status: true, approved: true },
    });
    const savedTaskKeys = new Set(
      savedTasks.map((task) => `${task.userId}:${task.taskNumber}`)
    );
    if (
      savedTasks.length !== expectedTasks.length ||
      expectedTasks.some(({ userId, taskNumber }) => !savedTaskKeys.has(`${userId}:${taskNumber}`)) ||
      savedTasks.some((task) => !task.approved)
    ) {
      throw new Error("Task verification failed: expected assignments are missing or unapproved.");
    }
    verifiedTaskCount = savedTasks.length;
    for (const task of savedTasks) verifiedTaskStatuses[task.status] += 1;

    const pendingReviews = await prisma.review.findMany({
      where: {
        userId: { in: employees.map((employee) => employee.id) },
        type: "FINAL_YEAR",
        period: reviewPeriod,
        status: "PENDING",
      },
      select: { userId: true },
    });
    const pendingReviewOwners = new Set(pendingReviews.map((review) => review.userId));
    if (pendingReviewOwners.size !== employees.length) {
      throw new Error(
        `Review verification failed: found ${pendingReviewOwners.size} pending review(s) for ${employees.length} employees.`
      );
    }
    verifiedPendingReviews = pendingReviewOwners.size;
  }

  console.log(
    JSON.stringify(
      {
        mode: applyChanges ? "applied" : "dry-run",
        database: isLocalDatabase(databaseUrl) ? "local" : "non-local",
        employees: employees.length,
        managerLinksCreated,
        tasksCreated,
        reviewsCreated,
        reviewsAlreadyPresent,
        existingReviewDetails,
        ...(applyChanges
          ? { verifiedTaskCount, verifiedTaskStatuses, verifiedPendingReviews }
          : {}),
      },
      null,
      2
    )
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
