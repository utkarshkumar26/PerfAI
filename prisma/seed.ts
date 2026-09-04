import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const defaultPasswordHash = await bcrypt.hash("Password1", 12);
  const utkarshPasswordHash = await bcrypt.hash("Utkarsh@2025", 12);

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.careerSuggestion.deleteMany();
  await prisma.keyResult.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.goal.deleteMany();

  const engineering = await prisma.department.upsert({
    where: { name: "Engineering" },
    update: {},
    create: { name: "Engineering" },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@perfai.demo" },
    update: {
      name: "Priya Sharma",
      designation: "Engineering Manager",
      experience: 9,
      skills: ["Leadership", "Strategy", "TypeScript", "Engineering Management"],
      departmentId: engineering.id,
    },
    create: {
      email: "manager@perfai.demo",
      name: "Priya Sharma",
      passwordHash: defaultPasswordHash,
      role: "MANAGER",
      designation: "Engineering Manager",
      experience: 9,
      skills: ["Leadership", "Strategy", "TypeScript", "Engineering Management"],
      departmentId: engineering.id,
    },
  });

  const teamMembers = [
    {
      email: "utkarshtiwari20020@gmail.com",
      name: "Utkarsh Kumar",
      passwordHash: utkarshPasswordHash,
      role: "EMPLOYEE" as const,
      designation: "Software Engineer",
      experience: 1,
      skills: ["React.js", "Next.js", "TypeScript", "Node.js", "Python", "Prisma", "PostgreSQL"],
    },
    {
      email: "nihal@perfai.demo",
      name: "Nihal Rajkumar Dubey",
      passwordHash: defaultPasswordHash,
      role: "EMPLOYEE" as const,
      designation: "Software Engineer",
      experience: 2,
      skills: ["GraphQL", "Privacy", "Backend", "TypeScript"],
    },
    {
      email: "akshitha@perfai.demo",
      name: "Lekkala Akshitha Reddy",
      passwordHash: defaultPasswordHash,
      role: "EMPLOYEE" as const,
      designation: "Software Engineer",
      experience: 2,
      skills: ["Frontend", "React", "Next.js", "Tailwind"],
    },
    {
      email: "shyam@perfai.demo",
      name: "Shyam R",
      passwordHash: defaultPasswordHash,
      role: "EMPLOYEE" as const,
      designation: "Senior Software Engineer",
      experience: 5,
      skills: ["Java", "Distributed Systems", "Microservices", "Kafka"],
    },
    {
      email: "bharath@perfai.demo",
      name: "Bharath B",
      passwordHash: defaultPasswordHash,
      role: "EMPLOYEE" as const,
      designation: "QA Engineer",
      experience: 3,
      skills: ["Playwright", "E2E Testing", "Jest", "Automation"],
    },
    {
      email: "tanmay@perfai.demo",
      name: "Tanmay Kumar Sen",
      passwordHash: defaultPasswordHash,
      role: "EMPLOYEE" as const,
      designation: "Frontend Engineer",
      experience: 2,
      skills: ["UI/UX", "React", "TypeScript", "Storybook"],
    },
    {
      email: "jayanta@perfai.demo",
      name: "Jayanta Ghosh",
      passwordHash: defaultPasswordHash,
      role: "EMPLOYEE" as const,
      designation: "Backend Engineer",
      experience: 4,
      skills: ["Python", "Django", "PostgreSQL", "FastAPI"],
    },
    {
      email: "abhishek@perfai.demo",
      name: "Abhishek Gupta",
      passwordHash: defaultPasswordHash,
      role: "EMPLOYEE" as const,
      designation: "Full Stack Engineer",
      experience: 3,
      skills: ["Node.js", "React", "AWS", "GraphQL"],
    },
    {
      email: "vinay@perfai.demo",
      name: "Vinay Kumar K",
      passwordHash: defaultPasswordHash,
      role: "EMPLOYEE" as const,
      designation: "DevOps Engineer",
      experience: 4,
      skills: ["Docker", "Kubernetes", "CI/CD", "Terraform"],
    },
    {
      email: "abhay@perfai.demo",
      name: "Abhay Anand",
      passwordHash: defaultPasswordHash,
      role: "EMPLOYEE" as const,
      designation: "Software Engineer",
      experience: 2,
      skills: ["JavaScript", "TypeScript", "Next.js", "REST APIs"],
    },
  ];

  const userMap: Record<string, any> = {};

  for (const m of teamMembers) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {
        name: m.name,
        designation: m.designation,
        experience: m.experience,
        skills: m.skills,
        departmentId: engineering.id,
        managerId: manager.id,
      },
      create: {
        email: m.email,
        name: m.name,
        passwordHash: m.passwordHash,
        role: m.role,
        designation: m.designation,
        experience: m.experience,
        skills: m.skills,
        departmentId: engineering.id,
        managerId: manager.id,
      },
    });
    userMap[m.name] = user;
  }

  const utkarsh = userMap["Utkarsh Kumar"];

  // Seed Rich Tasks matching Reference Images
  const tasksSeed = [
    // Utkarsh's tasks (Matches Image 2 & 3)
    {
      taskNumber: "T195721645",
      title: "[PMT][Bug] [PMT] Calibration set casing and content edit",
      description: "Content and casing in headers are inconsistent. Please change Flag/Prompts to Flags & prompts across the calibrations table.",
      priority: "LOW" as const,
      status: "COMPLETED" as const,
      progress: 100,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "S",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "UI/Content - Something doesn't look right or the copy is incorrect",
      sectionOrTab: "Calibrations",
      reproSteps: "1. Navigate to Calibrations tab\n2. Inspect table header titles\n3. Notice inconsistent capitalization 'Flag/Prompts'\n4. Fix: Change to 'Flags & prompts'",
      expectedResult: "All table headers must use standard title casing.",
      actualResult: "Headers show mixed casing 'Flag/Prompts' instead of 'Flags & prompts'.",
      debugInfo: {
        browser: "Chrome 126",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        userId: "5248007",
        ip: "2620:10d:c085:21e1::1208",
        env: "Production (Env 66)",
        revision: "1014916717",
      },
      comments: [
        {
          id: "c1",
          userId: manager.id,
          userName: "Priya Sharma",
          text: "Thanks Utkarsh! Verified in staging build 1014916717.",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      startDate: new Date("2026-08-25"),
      dueDate: new Date("2026-09-08"),
      userId: utkarsh.id,
      assignedById: manager.id,
    },
    {
      taskNumber: "T245810127",
      title: "Test fbsource//nest/apps/treasury:e2e_tests",
      description: "Run and stabilize end-to-end test suite for treasury service endpoints with mock payment gateways.",
      priority: "HIGH" as const,
      status: "IN_PROGRESS" as const,
      progress: 65,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "M",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "Backend / API Testing",
      sectionOrTab: "Treasury E2E",
      reproSteps: "Execute `yarn test:e2e --filter=treasury` and check flakiness in CI runner.",
      expectedResult: "100% green test pass rate without race conditions.",
      actualResult: "2 test cases timeout occasionally during concurrent requests.",
      startDate: new Date("2026-08-25"),
      dueDate: new Date("2026-09-08"),
      userId: utkarsh.id,
      assignedById: manager.id,
    },
    {
      taskNumber: "T245393707",
      title: "Fix ESLint Warning: Replace unused variable in CacheStore",
      description: "Clean up deprecated cache keys and eliminate unused typescript variables across memory-store.",
      priority: "HIGH" as const,
      status: "IN_PROGRESS" as const,
      progress: 45,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "XS",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "Code Quality / Refactoring",
      sectionOrTab: "CacheStore",
      startDate: new Date("2026-08-25"),
      dueDate: new Date("2026-09-08"),
      userId: utkarsh.id,
      assignedById: manager.id,
    },
    {
      taskNumber: "T245540633",
      title: "[SLA] Final review needed for Auth module migration",
      description: "Perform final security and token signature verification before deploying JWT session service to production.",
      priority: "HIGH" as const,
      status: "TODO" as const,
      progress: 0,
      approved: true,
      section: "DOING",
      project: "Accounting Portal",
      size: "L",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "Security / Architecture",
      sectionOrTab: "Auth / Session",
      startDate: new Date("2026-08-25"),
      dueDate: new Date("2026-09-08"),
      userId: utkarsh.id,
      assignedById: manager.id,
    },
    {
      taskNumber: "T245649527",
      title: "Follow-up task for D86922: Optimize Prisma query joins",
      description: "Batch query relations in employee dashboard endpoint to reduce database round-trips from 14 to 2 queries.",
      priority: "HIGH" as const,
      status: "TODO" as const,
      progress: 10,
      approved: false,
      section: "LATER",
      project: "Build People",
      size: "M",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "Performance / DB Optimization",
      sectionOrTab: "Database Queries",
      startDate: new Date("2026-08-25"),
      dueDate: new Date("2026-09-08"),
      userId: utkarsh.id,
      assignedById: manager.id,
    },

    // Nihal Rajkumar Dubey
    {
      taskNumber: "T245652478",
      title: "Enforce privacy-correct Viewers in GraphQL endpoints",
      description: "Add permission context middleware to prevent unauthorized data exposure on employee profile mutations.",
      priority: "HIGH" as const,
      status: "IN_PROGRESS" as const,
      progress: 50,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "L",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "Security / Privacy",
      sectionOrTab: "GraphQL API",
      startDate: new Date("2026-08-24"),
      dueDate: new Date("2026-09-20"),
      userId: userMap["Nihal Rajkumar Dubey"].id,
      assignedById: manager.id,
    },

    // Shyam R
    {
      taskNumber: "T242948225",
      title: "[CSC][BE] convert ProcurementCart to async batch worker",
      description: "Decouple synchronous checkout transactions by migrating cart settlement to Kafka queue consumers.",
      priority: "MEDIUM" as const,
      status: "IN_PROGRESS" as const,
      progress: 75,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "XL",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "Architecture / Backend",
      sectionOrTab: "Procurement",
      startDate: new Date("2026-08-20"),
      dueDate: new Date("2026-09-15"),
      userId: userMap["Shyam R"].id,
      assignedById: manager.id,
    },
    {
      taskNumber: "T242954420",
      title: "[CSC] [BE] Migrate email -> CustomerNotification service",
      description: "Replace legacy SMTP transport layer with unified notification API with rate limiting and templates.",
      priority: "HIGH" as const,
      status: "TODO" as const,
      progress: 15,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "M",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "Infrastructure",
      sectionOrTab: "Notifications",
      startDate: new Date("2026-08-24"),
      dueDate: new Date("2026-09-30"),
      userId: userMap["Shyam R"].id,
      assignedById: manager.id,
    },

    // Jayanta Ghosh
    {
      taskNumber: "T238598581",
      title: "'Map' is no-unused-vars in HiringBaseController",
      description: "Refactor Map import to remove unused global polyfills in hiring controller module.",
      priority: "LOW" as const,
      status: "IN_PROGRESS" as const,
      progress: 40,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "XS",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "Code Cleanup",
      sectionOrTab: "Hiring Module",
      startDate: new Date("2026-08-24"),
      dueDate: new Date("2026-09-30"),
      userId: userMap["Jayanta Ghosh"].id,
      assignedById: manager.id,
    },
    {
      taskNumber: "T160525873",
      title: "'List' is no-unused-vars in HiringBaseModel",
      description: "Clean type imports for List in HiringBaseModel and update interface definitions.",
      priority: "LOW" as const,
      status: "IN_PROGRESS" as const,
      progress: 40,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "XS",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "Code Cleanup",
      sectionOrTab: "Hiring Models",
      startDate: new Date("2026-08-24"),
      dueDate: new Date("2026-09-30"),
      userId: userMap["Jayanta Ghosh"].id,
      assignedById: manager.id,
    },

    // Lekkala Akshitha Reddy
    {
      taskNumber: "T242184478",
      title: "Implement responsive Table view with sticky header",
      description: "Build custom scrollable data table with sticky column headers and keyboard navigation support.",
      priority: "MEDIUM" as const,
      status: "IN_PROGRESS" as const,
      progress: 60,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "M",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "UI / Component",
      sectionOrTab: "Task Board",
      startDate: new Date("2026-08-24"),
      dueDate: new Date("2026-09-25"),
      userId: userMap["Lekkala Akshitha Reddy"].id,
      assignedById: manager.id,
    },

    // Bharath B
    {
      taskNumber: "T239991623",
      title: "Set up automated Playwright visual regression tests",
      description: "Configure snapshot testing for dark and light theme components on PR builds.",
      priority: "HIGH" as const,
      status: "TODO" as const,
      progress: 20,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "L",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "QA Automation",
      sectionOrTab: "CI / Testing",
      startDate: new Date("2026-08-26"),
      dueDate: new Date("2026-09-28"),
      userId: userMap["Bharath B"].id,
      assignedById: manager.id,
    },

    // Tanmay Kumar Sen
    {
      taskNumber: "T241639053",
      title: "Upgrade Tailwind tokens and glassmorphism styling",
      description: "Standardize theme CSS variables for border highlights and modal backdrop filters.",
      priority: "MEDIUM" as const,
      status: "IN_PROGRESS" as const,
      progress: 55,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "S",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "Design System",
      sectionOrTab: "Theme Tokens",
      startDate: new Date("2026-08-25"),
      dueDate: new Date("2026-09-22"),
      userId: userMap["Tanmay Kumar Sen"].id,
      assignedById: manager.id,
    },

    // Abhishek Gupta
    {
      taskNumber: "T242895097",
      title: "Build real-time notification socket listener",
      description: "Add WebSocket handler for instant task updates and assignment alerts across sessions.",
      priority: "HIGH" as const,
      status: "TODO" as const,
      progress: 0,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "M",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "Real-time / WebSocket",
      sectionOrTab: "Notifications",
      startDate: new Date("2026-08-27"),
      dueDate: new Date("2026-09-30"),
      userId: userMap["Abhishek Gupta"].id,
      assignedById: manager.id,
    },

    // Vinay Kumar K
    {
      taskNumber: "T142870888",
      title: "Optimize Docker multi-stage build caching in GitHub Actions",
      description: "Cut deployment artifact build times by caching node_modules and Prisma binary engines.",
      priority: "MEDIUM" as const,
      status: "COMPLETED" as const,
      progress: 100,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "M",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "DevOps / CI",
      sectionOrTab: "Deployment Pipeline",
      startDate: new Date("2026-08-20"),
      dueDate: new Date("2026-08-30"),
      userId: userMap["Vinay Kumar K"].id,
      assignedById: manager.id,
    },

    // Abhay Anand
    {
      taskNumber: "T142990522",
      title: "Implement task search and multi-tag filtering",
      description: "Enable instant client-side and server-side filtering by assignee, priority, status and project.",
      priority: "HIGH" as const,
      status: "IN_PROGRESS" as const,
      progress: 80,
      approved: true,
      section: "ASSIGNED",
      project: "Build People",
      size: "M",
      sprint: "Sprint 42",
      owningTeam: "Build People",
      bugType: "Feature / Search",
      sectionOrTab: "Tasks View",
      startDate: new Date("2026-08-24"),
      dueDate: new Date("2026-09-18"),
      userId: userMap["Abhay Anand"].id,
      assignedById: manager.id,
    },
  ];

  for (const t of tasksSeed) {
    await prisma.goal.create({
      data: t,
    });
  }

  // Reviews & Notifications
  await prisma.review.create({
    data: {
      period: "2026-08",
      type: "MONTHLY",
      input: {
        summary: "Monthly performance evaluation and sprint output",
        role: "Software Engineer",
      },
      content:
        "Utkarsh Kumar consistently delivers high-quality engineering features with speed and precision. Demonstrated exceptional ownership in enterprise tooling, AI workflows, and task platform execution.",
      strengths: [
        "Full-stack engineering",
        "AI workflow automation",
        "Problem solving",
        "Agile execution",
      ],
      weaknesses: ["System design documentation depth"],
      growthAreas: ["Architecture design", "Technical mentoring"],
      actionPlan:
        "Continue leading complex enterprise features and mentor junior engineers on platform best practices.",
      rating: 4.8,
      aiGenerated: true,
      userId: utkarsh.id,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: utkarsh.id,
        type: "MANAGER_FEEDBACK",
        title: "New task assigned",
        message: "Priya Sharma assigned you: Test fbsource//nest/apps/treasury:e2e_tests",
        link: "/tasks",
      },
      {
        userId: utkarsh.id,
        type: "WEEKLY_REMINDER",
        title: "Sprint 42 Check-in",
        message: "Please log your task progress before Friday standup.",
        link: "/tasks",
      },
    ],
  });

  console.log("Seed complete successfully.");
  console.log("  Manager login: manager@perfai.demo / Password1");
  console.log("  Utkarsh login: utkarshtiwari20020@gmail.com / Utkarsh@2025");
  teamMembers.forEach((m) => console.log(`  Team member: ${m.name} (${m.email} / Password1)`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

