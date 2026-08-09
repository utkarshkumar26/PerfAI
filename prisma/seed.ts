import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const defaultPasswordHash = await bcrypt.hash("Password1", 12);
  const utkarshPasswordHash = await bcrypt.hash("Utkarsh@2025", 12);

  const engineering = await prisma.department.upsert({
    where: { name: "Engineering" },
    update: {},
    create: { name: "Engineering" },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@perfai.demo" },
    update: {},
    create: {
      email: "manager@perfai.demo",
      name: "Priya Sharma",
      passwordHash: defaultPasswordHash,
      role: "MANAGER",
      designation: "Engineering Manager",
      experience: 9,
      skills: ["Leadership", "Strategy", "TypeScript"],
      departmentId: engineering.id,
    },
  });

  const utkarsh = await prisma.user.upsert({
    where: { email: "utkarshtiwari20020@gmail.com" },
    update: {
      name: "Utkarsh Kumar",
      passwordHash: utkarshPasswordHash,
      role: "EMPLOYEE",
      designation: "Software Engineer",
      experience: 1,
      bio:
        "Software Engineer with 1+ year of experience in full-stack application development, enterprise software maintenance, and AI-driven workflow automation. Passionate about building scalable software solutions and solving complex engineering problems in Agile environments.",
      skills: [
        "Java",
        "Python",
        "JavaScript",
        "TypeScript",
        "C++",
        "SQL",
        "PHP",
        "Spring Boot",
        "React.js",
        "Next.js",
        "Node.js",
        "Hibernate",
        "JPA",
        "Flask",
        "Bootstrap",
        "MVC",
        "MySQL",
        "PostgreSQL",
        "MongoDB",
        "Git",
        "GitHub",
        "Jenkins",
        "AWS",
        "JUnit",
        "CI/CD",
        "Maven",
        "GraphQL",
        "REST APIs",
        "Docker",
        "Jira",
        "Data Structures & Algorithms",
        "OOP",
        "DBMS/RDBMS",
        "SDLC",
        "Microservices",
        "Agile Methodology",
        "Version Control",
        "Bug Fixing",
        "System Design",
        "Generative AI",
        "Prompt Engineering",
        "AI Automation",
      ],
      education:
        "Birla Institute of Technology, Mesra — B.Tech in Computer Science and Engineering (2021–2025), CGPA: 7.3/10",
      githubUrl: "https://github.com/utkarshtiwari04",
      linkedinUrl: "https://linkedin.com/in/utkarshtiwari04",
      portfolioUrl: "https://utkarshkumar.dev",
      departmentId: engineering.id,
      managerId: manager.id,
    },
    create: {
      email: "utkarshtiwari20020@gmail.com",
      name: "Utkarsh Kumar",
      passwordHash: utkarshPasswordHash,
      role: "EMPLOYEE",
      designation: "Software Engineer",
      experience: 1,
      bio:
        "Software Engineer with 1+ year of experience in full-stack application development, enterprise software maintenance, and AI-driven workflow automation. Passionate about building scalable software solutions and solving complex engineering problems in Agile environments.",
      skills: [
        "Java",
        "Python",
        "JavaScript",
        "TypeScript",
        "C++",
        "SQL",
        "PHP",
        "Spring Boot",
        "React.js",
        "Next.js",
        "Node.js",
        "Hibernate",
        "JPA",
        "Flask",
        "Bootstrap",
        "MVC",
        "MySQL",
        "PostgreSQL",
        "MongoDB",
        "Git",
        "GitHub",
        "Jenkins",
        "AWS",
        "JUnit",
        "CI/CD",
        "Maven",
        "GraphQL",
        "REST APIs",
        "Docker",
        "Jira",
        "Data Structures & Algorithms",
        "OOP",
        "DBMS/RDBMS",
        "SDLC",
        "Microservices",
        "Agile Methodology",
        "Version Control",
        "Bug Fixing",
        "System Design",
        "Generative AI",
        "Prompt Engineering",
        "AI Automation",
      ],
      education:
        "Birla Institute of Technology, Mesra — B.Tech in Computer Science and Engineering (2021–2025), CGPA: 7.3/10",
      githubUrl: "https://github.com/utkarshtiwari04",
      linkedinUrl: "https://linkedin.com/in/utkarshtiwari04",
      portfolioUrl: "https://utkarshkumar.dev",
      departmentId: engineering.id,
      managerId: manager.id,
    },
  });

  const employeeSeed = [
    {
      email: "ada@perfai.demo",
      name: "Ada Lovelace",
      designation: "Frontend Engineer",
      experience: 3,
      skills: ["React", "TypeScript", "CSS"],
    },
    {
      email: "grace@perfai.demo",
      name: "Grace Hopper",
      designation: "Backend Engineer",
      experience: 5,
      skills: ["Node.js", "PostgreSQL", "GraphQL"],
    },
    {
      email: "alan@perfai.demo",
      name: "Alan Turing",
      designation: "Full-stack Engineer",
      experience: 4,
      skills: ["React", "Node.js", "Docker"],
    },
  ];

  const employees = [utkarsh];
  for (const e of employeeSeed) {
    employees.push(
      await prisma.user.upsert({
        where: { email: e.email },
        update: {},
        create: {
          ...e,
          passwordHash: defaultPasswordHash,
          role: "EMPLOYEE",
          departmentId: engineering.id,
          managerId: manager.id,
        },
      })
    );
  }

  const utkarshGoals = [
    {
      title: "Lead QA Automation Initiative",
      description:
        "Design a scalable QA automation project structure, mentor engineers, and improve automation coverage using Playwright and AI-powered workflows.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      category: "Engineering",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      progress: 72,
      approved: true,
    },
    {
      title: "Enhance Meta Internal Tools",
      description:
        "Improve React and GraphQL-based internal enterprise applications by adding features, fixing bugs, and optimizing application stability.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      category: "Product",
      dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      progress: 68,
      approved: true,
    },
    {
      title: "Ship AI Performance Review & Career Assistant",
      description:
        "Build an AI-powered performance review and career guidance platform using Next.js, TypeScript, Prisma, and Gemini integration.",
      priority: "CRITICAL",
      status: "COMPLETED",
      category: "AI",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      progress: 100,
      approved: true,
    },
    {
      title: "Create MCQ Generator Platform",
      description:
        "Develop a Flask-based app for automated MCQ generation using NLP techniques and a responsive user interface.",
      priority: "MEDIUM",
      status: "COMPLETED",
      category: "Learning",
      dueDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      progress: 100,
      approved: true,
    },
    {
      title: "Strengthen CI/CD and Backend Reliability",
      description:
        "Improve deployment, testing, and production debugging workflows by using CI/CD, Docker, AWS, and backend refactoring best practices.",
      priority: "MEDIUM",
      status: "TODO",
      category: "Process",
      dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      progress: 20,
      approved: false,
    },
  ];

  for (const goal of utkarshGoals) {
    await prisma.goal.create({
      data: {
        ...goal,
        userId: utkarsh.id,
        assignedById: manager.id,
      },
    });
  }

  const reviewDate = new Date();
  reviewDate.setMonth(reviewDate.getMonth() - 1);
  await prisma.review.create({
    data: {
      period: `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, "0")}`,
      type: "MONTHLY",
      input: {
        summary: "Performance review based on resume and goals",
        role: "Software Engineer",
      },
      content:
        "Utkarsh Kumar is a strong full-stack engineer with a clear focus on enterprise application delivery, AI automation, and team enablement. He combines practical software engineering skills with proactive problem solving, delivering impactful features and improving engineering workflows across frontend, backend, and CI/CD processes.",
      strengths: [
        "Full-stack engineering",
        "AI workflow automation",
        "Enterprise application support",
        "Problem solving",
        "Collaboration",
      ],
      weaknesses: ["System design depth", "Documentation consistency"],
      growthAreas: ["Architecture design", "Team leadership", "Technical mentoring"],
      actionPlan:
        "Continue improving architecture decisions, strengthen documentation, and expand leadership through mentoring and platform design work.",
      rating: 4.4,
      aiGenerated: true,
      userId: utkarsh.id,
      createdAt: reviewDate,
    },
  });

  await prisma.careerSuggestion.create({
    data: {
      userId: utkarsh.id,
      type: "ROADMAP",
      summary: "Target senior software engineer and platform engineering roles with emphasis on AI automation, architecture, and team leadership.",
      content: {
        focus: ["System design", "AI engineering", "Leadership"],
        nextSteps: [
          "Deepen architecture and distributed systems skills",
          "Lead more design and mentoring initiatives",
          "Strengthen cloud-native and AI integration patterns",
        ],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: utkarsh.id,
        type: "WEEKLY_REMINDER",
        title: "Weekly check-in",
        message: "Update your progress for the QA automation initiative.",
        link: "/goals",
      },
      {
        userId: utkarsh.id,
        type: "REVIEW_READY",
        title: "Performance review ready",
        message: "Your monthly review is ready and includes growth recommendations.",
        link: "/reviews",
      },
      {
        userId: utkarsh.id,
        type: "CAREER_SUGGESTION",
        title: "Career path update",
        message: "Explore AI automation and architecture opportunities aligned with your profile.",
        link: "/career",
      },
    ],
  });

  const statuses = ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"] as const;
  const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
  const categories = ["Engineering", "Learning", "Process", "Customer"];

  for (const emp of employees) {
    for (let j = 0; j < 3; j++) {
      const status = statuses[(j + (emp.id === utkarsh.id ? 1 : 2)) % statuses.length];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + ((j - 1) * 9));
      await prisma.goal.create({
        data: {
          title: `${emp.designation} goal ${j + 1}`,
          description: `Demo deliverable for ${emp.name}`,
          priority: priorities[j % priorities.length],
          status,
          category: categories[j % categories.length],
          dueDate,
          progress: status === "COMPLETED" ? 100 : (j + 1) * 25,
          userId: emp.id,
          assignedById: manager.id,
          approved: j % 2 === 0,
        },
      });
    }

    for (let m = 0; m < 2; m++) {
      const createdAt = new Date();
      createdAt.setMonth(createdAt.getMonth() - (2 - m));
      await prisma.review.create({
        data: {
          period: `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`,
          type: "MONTHLY",
          input: { achievements: "Seeded review" },
          content: `Monthly review for ${emp.name}. Strong contribution and steady execution across the cycle.`,
          strengths: ["Execution", "Teamwork"],
          weaknesses: ["Documentation"],
          growthAreas: ["Communication"],
          actionPlan: "Keep improving communication and planning cadence.",
          rating: 3.8 + m * 0.4,
          aiGenerated: true,
          userId: emp.id,
          createdAt,
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: emp.id,
        type: "WEEKLY_REMINDER",
        title: "Weekly check-in",
        message: "Log your progress for this week.",
        link: "/goals",
      },
    });
  }

  const objective = await prisma.objective.create({
    data: {
      title: "Ship AI performance platform v1",
      description: "Company-level objective for the quarter",
      level: "COMPANY",
      cycle: "2026-Q3",
      ownerId: manager.id,
      keyResults: {
        create: [
          {
            title: "Launch review generation",
            target: 1,
            current: 0.8,
            unit: "release",
            ownerId: manager.id,
          },
          {
            title: "Active weekly users",
            target: 100,
            current: 42,
            unit: "users",
            ownerId: manager.id,
          },
        ],
      },
    },
  });

  await prisma.objective.create({
    data: {
      title: "Grow frontend expertise",
      level: "TEAM",
      cycle: "2026-Q3",
      parentId: objective.id,
      ownerId: manager.id,
      keyResults: {
        create: [
          {
            title: "Complete React 19 migration",
            target: 100,
            current: 60,
            unit: "%",
            ownerId: manager.id,
          },
        ],
      },
    },
  });

  console.log("Seed complete.");
  console.log("  Manager login: manager@perfai.demo / Password1");
  console.log("  Utkarsh login: utkarshtiwari20020@gmail.com / Utkarsh@2025");
  employees.forEach((e) => console.log(`  Employee login: ${e.email} / Password1`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
