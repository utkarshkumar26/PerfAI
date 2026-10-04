# PerfAI System Design Features

This guide explains the system-design features currently implemented in PerfAI, what each one does, where to see its effect, and how to try it.

## Quick overview

| Feature | What it does | Where you notice it |
|---|---|---|
| Database transactions | Makes related database writes succeed or fail together | Creating/assigning tasks and creating or updating reviews |
| Cursor pagination | Loads large lists in small batches without relying on page numbers | Reviews and Notifications pages; use their **Load more** buttons |
| Rate limiting | Restricts repeated requests to protect login and AI endpoints | Login and AI API requests; limits are enforced in the background |
| Analytics caching | Temporarily reuses computed analytics to reduce database work and improve response time | Analytics page |

## 1. Database transactions

### What it does

A transaction groups related database changes into one all-or-nothing operation. If any database operation in the group fails, the database rolls back the other changes in that transaction. This avoids partially completed workflows.

### Where it is used

- **Tasks / Goals:** Creating a task also writes an activity log and, when a manager assigns it to an employee, a notification. These writes are grouped in a transaction. Task updates also group the task change with related database records.
- **Reviews:** Saving an AI-generated review groups the review and its related records; review updates group the review change with any related notification work included in that operation.

Relevant implementation: `features/goals/actions/goal.service.ts` and `features/reviews/actions/review.service.ts`.

### How to try it

1. Sign in as a manager and open **Tasks** (`/tasks`) or **Goals** (`/goals`).
2. Create and assign a task to an existing employee.
3. Check the employee's task list and notifications for the assignment.
4. You can also create or update a review on **Reviews** (`/reviews`).

Those steps exercise the successful transaction path. To prove rollback behavior, a test must deliberately make one of the writes fail; normal UI use is not expected to trigger that failure.

## 2. Cursor pagination

### What it does

Instead of fetching every record at once or using page numbers, the API returns a limited batch and a cursor that identifies where the next batch should begin. This works well as records are added or removed and keeps large lists more manageable.

### Where it is used

- **Reviews:** `/reviews` — review lists have a **Load more reviews** button when another batch exists.
- **Notifications:** `/notifications` — notifications have a **Load more notifications** button when another batch exists.

The API responses include the current items and a `nextCursor`; list ordering uses stable timestamps and IDs so records can be continued consistently. The relevant service code is in `features/reviews/actions/review.service.ts`, `features/notifications/actions/notification.service.ts`, and `lib/date-cursor.ts`.

### How to try it

1. Sign in and open **Reviews** or **Notifications**.
2. Make sure the account has enough records to exceed the first batch. If the list is short, add reviews or generate notifications first.
3. Scroll to the bottom and select **Load more reviews** or **Load more notifications**.
4. Confirm additional records appear and earlier records are not duplicated.

The button is hidden when there are no more records to fetch.

## 3. Rate limiting and login lockout

### What it does

Rate limiting limits how frequently a client can call selected APIs within a time window. This helps protect shared services from accidental or abusive request bursts.

Current policies:

- Login: at most **30 requests per IP address per 15 minutes**.
- AI endpoints: at most **20 requests per authenticated user per 10 minutes**.
- Failed login protection: after **3 incorrect email/password attempts** for an email address, sign-in is locked for **1 hour**. The login form reports how many attempts remain. Successful login clears the failed-attempt counter.

Login/API rate limiting uses `lib/rate-limit.ts`; the failed-login counter and lock are in `lib/login-attempts.ts`. AI API routes use the AI policy. The login UI is in `features/auth/components/login-form.tsx`.

### Where to see it

- **Login:** `/login` — the initial form explains the three-attempt policy. After an incorrect password, an inline message shows remaining attempts; after the third failure it shows the lock warning and countdown.
- **AI features:** try AI generation or advice features in the app. Under normal use, the limit is not visible; when exceeded, the API responds with a too-many-requests error.

### Local development and production setup

- In local development, if Upstash is not configured, the login and rate-limit counters use in-process memory. This supports local testing, but counters are not shared between server processes and reset when the development server restarts.
- In production, configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the deployment environment. Production requires Redis for shared rate-limit and login-lockout state; missing or unavailable Redis causes the protected request to fail rather than silently disabling protection.

The variable names are listed in `.env.example`. Do not put real secrets in this guide or commit them to source control.

### How to try the login lockout

1. Open `/login` and enter an account email with a wrong password.
2. Submit once and confirm the message says **2 attempts remaining**.
3. Submit another wrong password and confirm it says **1 attempt remaining**.
4. Submit a third wrong password and confirm the one-hour lock message appears and the sign-in button is disabled while the countdown is active.
5. To test again locally, wait for the lock to expire or restart the development server (the local in-memory state resets on restart). Do not use a real user's account for repeated incorrect attempts.

### Demo login buttons

The login page also includes **Manager demo** and **Abhay (employee)** buttons. Selecting one fills the matching seeded email and password in the form; it does not submit the form automatically. Select **Sign in** to log in. Both demo accounts use `Password1` and are available only when the database has been seeded with the demo users.

## 4. Analytics caching

### What it does

Analytics calculations can require several database queries. PerfAI stores the computed result temporarily in Redis so repeated requests for the same user and reporting period can return faster and avoid repeating those queries.

### Where it is used

- **Analytics:** `/analytics` — weekly analytics are cached for **30 seconds** and monthly analytics for **60 seconds**.
- Cache keys include the analytics period and user/role filter so one user's result is not reused for another user's data.

Implementation: `features/analytics/actions/analytics.service.ts` and `features/analytics/actions/analytics-cache.ts`.

### How to try it

1. Configure Upstash Redis as described above.
2. Sign in and open **Analytics** (`/analytics`).
3. Refresh or revisit the page within 30 seconds for weekly data or 60 seconds for monthly data.
4. After the corresponding cache lifetime expires, the next request recomputes the result from the database and caches it again.

If an analytics cache read or write fails, the application logs the error and continues with fresh database results; caching is an optimization, not the source of truth.

## Useful app pages

- Login: `/login`
- Tasks: `/tasks`
- Goals: `/goals`
- Reviews: `/reviews`
- Notifications: `/notifications`
- Analytics: `/analytics`