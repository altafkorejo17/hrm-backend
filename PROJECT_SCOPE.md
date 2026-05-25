# HRM Backend — Project Scope & Build Guide

> Follow this document step by step. Each phase depends on the previous one.
> Current status is tracked per step.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | NestJS 11 | Modular, DI, decorators, TypeScript-first |
| ORM | TypeORM 0.3 | NestJS native, migrations, repository pattern |
| Database | MySQL 8 / MariaDB 10.11 | Relational, ACID, production-grade |
| Auth | JWT + Refresh Tokens | Stateless, scalable |
| Validation | class-validator + class-transformer | Decorator-based, works with NestJS pipes |
| Docs | Swagger (@nestjs/swagger) | Auto-generated from decorators |
| Config | @nestjs/config + Joi | Typed config + fail-fast env validation |
| Health | @nestjs/terminus | Standardised health checks |
| Password | bcrypt | Industry standard hashing |
| Roles | CASL or custom RBAC | Fine-grained permissions |
| File Upload | Multer + S3/local | Native NestJS support |
| Email | Nodemailer / Resend | Notifications and alerts |
| Cache | Redis (@nestjs/cache-manager) | Session store, rate limit, performance |
| Rate Limit | @nestjs/throttler | Protect endpoints from abuse |
| Testing | Jest + Supertest | Unit + e2e, built into NestJS |
| Migrations | TypeORM CLI | Schema versioning |

---

## Folder Conventions

Every module under `src/modules/<name>/` follows this structure:

```
modules/auth/
├── dto/
│   ├── login.dto.ts
│   └── register.dto.ts
├── entities/
│   └── user.entity.ts        ← only if entity belongs to this module
├── guards/
│   └── jwt-auth.guard.ts
├── strategies/
│   └── jwt.strategy.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.module.ts
└── auth.service.spec.ts
```

**Rules:**
- One module = one folder under `src/modules/`
- Shared code (guards, decorators, pipes) lives in `src/common/`
- Never import module A's service directly into module B — expose via module exports
- Every entity gets its own migration — never rely on `synchronize: true` in production

---

## API Response Shape

All endpoints return a consistent shape (enforced by `ResponseInterceptor`):

```json
// Success
{
  "success": true,
  "statusCode": 200,
  "message": "Employees fetched",
  "data": { ... },
  "timestamp": "2026-05-25T10:00:00.000Z"
}

// Error
{
  "success": false,
  "statusCode": 404,
  "message": "Employee not found",
  "path": "/api/v1/employees/999",
  "timestamp": "2026-05-25T10:00:00.000Z"
}

// Paginated list
{
  "success": true,
  "statusCode": 200,
  "message": "Employees fetched",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## Build Phases

---

### ✅ Phase 1 — Foundation
**Status: Complete**

- [x] Folder structure (`common/`, `config/`, `modules/`, `health/`)
- [x] Config with Joi validation (`app`, `database`, `jwt` namespaces)
- [x] Global exception filter (consistent error shape)
- [x] Global response interceptor (consistent success shape)
- [x] Swagger setup at `/api/docs`
- [x] API versioning (`/api/v1/`)
- [x] Health check endpoint (`GET /api/v1/health`)
- [x] Pagination DTO

---

### Phase 2 — Users & Authentication
**Dependencies: Phase 1**

#### Step 1 — Users Module

**Entity: `users`**
```
id            uuid, PK
email         varchar(255), unique, not null
password      varchar(255), not null       ← bcrypt hashed
firstName     varchar(100)
lastName      varchar(100)
role          enum(admin, hr, manager, employee)
isActive      boolean, default true
lastLoginAt   datetime, nullable
createdAt     datetime
updatedAt     datetime
deletedAt     datetime, nullable           ← soft delete
```

**Endpoints:**
```
POST   /api/v1/users              → create user (admin only)
GET    /api/v1/users              → list users (paginated)
GET    /api/v1/users/:id          → get user by id
PATCH  /api/v1/users/:id          → update user
DELETE /api/v1/users/:id          → soft delete
PATCH  /api/v1/users/:id/activate → re-activate user
```

**Best Practices:**
- Store only bcrypt hash, never plaintext password
- Soft delete (deletedAt) — never hard delete users
- `email` always lowercase before save
- Exclude `password` from all responses using `@Exclude()`

---

#### Step 2 — Auth Module

**Endpoints:**
```
POST  /api/v1/auth/register         → create account
POST  /api/v1/auth/login            → returns accessToken + refreshToken
POST  /api/v1/auth/refresh          → rotate refresh token
POST  /api/v1/auth/logout           → invalidate refresh token
POST  /api/v1/auth/forgot-password  → send reset email
POST  /api/v1/auth/reset-password   → verify token and update password
GET   /api/v1/auth/me               → current user profile
```

**Token Strategy:**
- `accessToken`: short-lived (15m), JWT signed with `JWT_SECRET`
- `refreshToken`: long-lived (30d), stored hashed in DB, rotated on use
- On logout: delete refresh token from DB

**Guards:**
- `JwtAuthGuard` — protects all routes by default via `APP_GUARD`
- `@Public()` decorator — opt-out for login/register routes
- `RolesGuard` — checks `@Roles(Role.Admin)` decorator

**Files to create:**
```
modules/auth/
├── dto/login.dto.ts
├── dto/register.dto.ts
├── dto/refresh-token.dto.ts
├── dto/forgot-password.dto.ts
├── dto/reset-password.dto.ts
├── strategies/jwt.strategy.ts
├── strategies/jwt-refresh.strategy.ts
├── guards/jwt-auth.guard.ts
├── guards/roles.guard.ts
├── decorators/public.decorator.ts
├── decorators/roles.decorator.ts
├── decorators/current-user.decorator.ts
├── auth.controller.ts
├── auth.service.ts
└── auth.module.ts
```

---

### Phase 3 — Organisation Structure
**Dependencies: Phase 2**

#### Step 3 — Departments Module

**Entity: `departments`**
```
id            uuid, PK
name          varchar(100), unique
code          varchar(20), unique         ← e.g. "ENG", "HR"
description   text, nullable
managerId     uuid, FK → employees.id, nullable
isActive      boolean, default true
createdAt / updatedAt / deletedAt
```

**Endpoints:**
```
POST   /api/v1/departments
GET    /api/v1/departments
GET    /api/v1/departments/:id
PATCH  /api/v1/departments/:id
DELETE /api/v1/departments/:id
GET    /api/v1/departments/:id/employees  → list employees in department
```

---

#### Step 4 — Positions Module

**Entity: `positions`**
```
id            uuid, PK
title         varchar(100)
departmentId  uuid, FK → departments.id
level         enum(junior, mid, senior, lead, manager, director)
isActive      boolean
createdAt / updatedAt / deletedAt
```

**Endpoints:**
```
POST   /api/v1/positions
GET    /api/v1/positions
GET    /api/v1/positions/:id
PATCH  /api/v1/positions/:id
DELETE /api/v1/positions/:id
```

---

### Phase 4 — Employee Management
**Dependencies: Phase 3**

#### Step 5 — Employees Module

**Entity: `employees`**
```
id               uuid, PK
employeeCode     varchar(20), unique       ← auto-generated: EMP-0001
userId           uuid, FK → users.id, unique
departmentId     uuid, FK → departments.id
positionId       uuid, FK → positions.id
managerId        uuid, FK → employees.id, nullable (self-referential)

-- Personal
firstName        varchar(100)
lastName         varchar(100)
dateOfBirth      date
gender           enum(male, female, other)
nationalId       varchar(50), nullable
phone            varchar(20)
personalEmail    varchar(255)

-- Address
address          text
city             varchar(100)
country          varchar(100)

-- Employment
hireDate         date
terminationDate  date, nullable
employmentType   enum(full_time, part_time, contract, intern)
status           enum(active, on_leave, terminated, suspended)

-- Bank
bankName         varchar(100), nullable
bankAccount      varchar(50), nullable

-- Emergency Contact
emergencyName    varchar(100)
emergencyPhone   varchar(20)
emergencyRelation varchar(50)

createdAt / updatedAt / deletedAt
```

**Endpoints:**
```
POST   /api/v1/employees
GET    /api/v1/employees                   → paginated + filter by dept/status
GET    /api/v1/employees/:id
PATCH  /api/v1/employees/:id
DELETE /api/v1/employees/:id               → soft delete (set status=terminated)
GET    /api/v1/employees/:id/documents
POST   /api/v1/employees/:id/documents     → upload document
GET    /api/v1/employees/:id/attendance
GET    /api/v1/employees/:id/leaves
GET    /api/v1/employees/:id/payslips
```

---

#### Step 6 — Documents Module

**Entity: `employee_documents`**
```
id            uuid, PK
employeeId    uuid, FK → employees.id
type          enum(id_card, passport, contract, certificate, other)
fileName      varchar(255)
filePath      varchar(500)
fileSize      int
mimeType      varchar(100)
uploadedById  uuid, FK → users.id
createdAt / updatedAt
```

**Best Practices:**
- Never expose internal file paths in API response
- Generate signed URLs for file access
- Validate mime type server-side (not just extension)
- Store files in S3 or `/uploads` volume, not in DB

---

### Phase 5 — Attendance & Time Tracking
**Dependencies: Phase 4**

#### Step 7 — Attendance Module

**Entity: `attendance`**
```
id              uuid, PK
employeeId      uuid, FK → employees.id
date            date
clockIn         datetime
clockOut        datetime, nullable
workHours       decimal(5,2), nullable     ← calculated on clockOut
status          enum(present, absent, late, half_day, holiday, weekend)
note            text, nullable
createdAt / updatedAt
```

**Endpoints:**
```
POST  /api/v1/attendance/clock-in
POST  /api/v1/attendance/clock-out
GET   /api/v1/attendance                   → list (admin/manager)
GET   /api/v1/attendance/me                → my attendance
GET   /api/v1/attendance/me/summary        → monthly summary
GET   /api/v1/attendance/:id
PATCH /api/v1/attendance/:id               → manual correction (admin only)
```

**Business Rules:**
- One record per employee per day
- `clockOut` must be after `clockIn`
- Auto-mark absent if no clock-in by end of day (cron job)
- Late if clock-in > 9:00 AM (configurable per department)

---

### Phase 6 — Leave Management
**Dependencies: Phase 4**

#### Step 8 — Leave Types Module

**Entity: `leave_types`**
```
id              uuid, PK
name            varchar(100)              ← "Annual Leave", "Sick Leave"
code            varchar(20), unique       ← "ANNUAL", "SICK"
daysAllowed     int
carryOver       boolean, default false
requiresDoc     boolean, default false    ← sick leave requires medical cert
isActive        boolean
createdAt / updatedAt
```

#### Step 9 — Leave Applications Module

**Entity: `leave_applications`**
```
id              uuid, PK
employeeId      uuid, FK → employees.id
leaveTypeId     uuid, FK → leave_types.id
startDate       date
endDate         date
totalDays       int                       ← calculated (excludes weekends)
reason          text
status          enum(pending, approved, rejected, cancelled)
reviewedById    uuid, FK → users.id, nullable
reviewedAt      datetime, nullable
reviewNote      text, nullable
createdAt / updatedAt
```

**Entity: `leave_balances`**
```
id              uuid, PK
employeeId      uuid, FK → employees.id
leaveTypeId     uuid, FK → leave_types.id
year            int
allocated       int
used            int
remaining       int                       ← calculated: allocated - used
createdAt / updatedAt
```

**Endpoints:**
```
GET    /api/v1/leave-types
POST   /api/v1/leave-types               (admin)
PATCH  /api/v1/leave-types/:id           (admin)

POST   /api/v1/leaves                    → apply for leave
GET    /api/v1/leaves                    → all applications (admin/manager)
GET    /api/v1/leaves/me                 → my applications
GET    /api/v1/leaves/:id
PATCH  /api/v1/leaves/:id/approve        (manager/admin)
PATCH  /api/v1/leaves/:id/reject         (manager/admin)
PATCH  /api/v1/leaves/:id/cancel         (employee, only if pending)
GET    /api/v1/leaves/balance/me         → my leave balances
```

**Business Rules:**
- Can't apply for leave with 0 remaining balance
- Can't apply for past dates
- Overlapping leave applications rejected automatically
- Manager notified by email on new application

---

### Phase 7 — Payroll
**Dependencies: Phase 5, Phase 6**

#### Step 10 — Salary Structure

**Entity: `salary_structures`**
```
id              uuid, PK
employeeId      uuid, FK → employees.id
basicSalary     decimal(12,2)
housingAllowance decimal(12,2)
transportAllowance decimal(12,2)
otherAllowances decimal(12,2)
effectiveDate   date
createdById     uuid, FK → users.id
createdAt / updatedAt
```

#### Step 11 — Payroll Processing

**Entity: `payroll_batches`**
```
id              uuid, PK
month           int
year            int
status          enum(draft, processing, approved, paid)
totalGross      decimal(14,2)
totalDeductions decimal(14,2)
totalNet        decimal(14,2)
processedById   uuid, FK → users.id
approvedById    uuid, FK → users.id, nullable
paidAt          datetime, nullable
createdAt / updatedAt
```

**Entity: `payslips`**
```
id              uuid, PK
batchId         uuid, FK → payroll_batches.id
employeeId      uuid, FK → employees.id
basicSalary     decimal(12,2)
allowances      decimal(12,2)
grossSalary     decimal(12,2)
taxDeduction    decimal(12,2)
otherDeductions decimal(12,2)
netSalary       decimal(12,2)
workingDays     int
presentDays     int
leaveDays       int
createdAt / updatedAt
```

**Endpoints:**
```
POST  /api/v1/salary-structures            → set employee salary (admin/hr)
GET   /api/v1/salary-structures/:employeeId

POST  /api/v1/payroll/batches              → create payroll batch
GET   /api/v1/payroll/batches
GET   /api/v1/payroll/batches/:id
POST  /api/v1/payroll/batches/:id/process  → calculate all payslips
POST  /api/v1/payroll/batches/:id/approve  → approve for payment
GET   /api/v1/payroll/batches/:id/payslips
GET   /api/v1/payroll/payslips/me          → my payslips
```

---

### Phase 8 — Performance Reviews
**Dependencies: Phase 4**

#### Step 12 — Performance Module

**Entity: `performance_reviews`**
```
id              uuid, PK
employeeId      uuid, FK → employees.id
reviewerId      uuid, FK → users.id
period          varchar(20)               ← "Q1-2026", "2026-H1"
type            enum(quarterly, annual, probation)
status          enum(draft, submitted, acknowledged)
overallRating   decimal(3,1)             ← 1.0 to 5.0
strengths       text
improvements    text
goals           text
comment         text, nullable            ← employee's comment
createdAt / updatedAt
```

**Entity: `performance_goals`**
```
id              uuid, PK
employeeId      uuid, FK → employees.id
title           varchar(200)
description     text
targetDate      date
status          enum(active, completed, cancelled)
progress        int                       ← 0-100
createdAt / updatedAt
```

**Endpoints:**
```
POST   /api/v1/performance/reviews
GET    /api/v1/performance/reviews
GET    /api/v1/performance/reviews/me
PATCH  /api/v1/performance/reviews/:id
POST   /api/v1/performance/reviews/:id/submit
POST   /api/v1/performance/reviews/:id/acknowledge

POST   /api/v1/performance/goals
GET    /api/v1/performance/goals/me
PATCH  /api/v1/performance/goals/:id
```

---

### Phase 9 — Cross-Cutting Features
**Dependencies: All above modules**

#### Step 13 — File Upload Service

**Files:**
```
common/
└── services/
    ├── storage.service.ts       ← abstraction (local or S3)
    └── storage.module.ts
```

- Local: save to `/uploads`, serve via static files
- S3: `@aws-sdk/client-s3` + pre-signed URLs
- Config flag: `STORAGE_DRIVER=local|s3`

---

#### Step 14 — Email Service

**Files:**
```
common/
└── mail/
    ├── mail.service.ts
    ├── mail.module.ts
    └── templates/
        ├── welcome.hbs
        ├── reset-password.hbs
        └── leave-approved.hbs
```

- Driver: Nodemailer (SMTP) or Resend API
- Templates: Handlebars (`.hbs`)
- Queue: send emails async (don't block the request)

**Trigger points:**
- User registered → welcome email
- Password reset requested → reset link
- Leave approved/rejected → notification
- Payslip generated → notification with PDF link

---

#### Step 15 — Notifications Module

**Entity: `notifications`**
```
id          uuid, PK
userId      uuid, FK → users.id
title       varchar(200)
body        text
type        enum(leave, payroll, performance, system)
isRead      boolean, default false
readAt      datetime, nullable
createdAt
```

**Endpoints:**
```
GET   /api/v1/notifications          → my notifications
PATCH /api/v1/notifications/:id/read
PATCH /api/v1/notifications/read-all
GET   /api/v1/notifications/unread-count
```

---

#### Step 16 — Reports Module

**Endpoints:**
```
GET /api/v1/reports/headcount         → employees by dept/status
GET /api/v1/reports/attendance        → attendance summary by period
GET /api/v1/reports/leave             → leave usage by type/dept
GET /api/v1/reports/payroll           → payroll cost by period
```

- Export as JSON, CSV, or PDF
- PDF via `@nestjs/pdfkit` or `puppeteer`

---

### Phase 10 — Production Readiness

#### Step 17 — Caching (Redis)

```typescript
// Cache expensive queries (reports, headcount)
@CacheKey('headcount')
@CacheTTL(300)
@UseInterceptors(CacheInterceptor)
getHeadcount() { ... }
```

- Install `@nestjs/cache-manager`, `cache-manager-redis-yet`
- Add Redis to `docker-compose.yml`
- Cache: reports, leave balances, payroll summaries

---

#### Step 18 — Rate Limiting

```typescript
// In app.module.ts
ThrottlerModule.forRoot([{
  name: 'global',
  ttl: 60000,
  limit: 100,
}])
```

- Global: 100 req/min
- Auth endpoints: 10 req/min (stricter)

---

#### Step 19 — Audit Logging

**Entity: `audit_logs`**
```
id          uuid, PK
userId      uuid, FK → users.id
action      varchar(100)     ← "EMPLOYEE_CREATED", "LEAVE_APPROVED"
entityType  varchar(100)     ← "Employee", "Leave"
entityId    uuid
before      json, nullable
after       json, nullable
ipAddress   varchar(45)
userAgent   text
createdAt
```

- Use a custom interceptor to auto-log mutations (POST/PATCH/DELETE)
- Never log passwords or tokens

---

#### Step 20 — Migrations

**Rules:**
- `synchronize: true` only in test
- Every entity change → new migration file
- Migration naming: `YYYYMMDDHHMMSS-description`
- Always write both `up()` and `down()`
- Test `down()` before deploying `up()` to production

```bash
make migrate-gen name=CreateUsersTable
make migrate-run
make migrate-revert
```

---

## Security Checklist

- [ ] Passwords hashed with bcrypt (cost factor ≥ 12)
- [ ] JWT secrets min 32 chars, different for access and refresh
- [ ] Refresh tokens stored hashed in DB
- [ ] `@Exclude()` on password field in entity
- [ ] `forbidNonWhitelisted: true` on ValidationPipe
- [ ] Rate limiting on auth endpoints
- [ ] Helmet middleware for HTTP headers
- [ ] CORS restricted to known origins in production
- [ ] File uploads: validate MIME type, limit size (10MB)
- [ ] SQL injection: use TypeORM query builder (parameterized)
- [ ] Audit log all sensitive operations
- [ ] Soft delete — never hard delete users or employees
- [ ] Env secrets never committed to git

---

## Testing Strategy

| Type | Tool | Target |
|---|---|---|
| Unit | Jest | Services (mock repos), utility functions |
| Integration | Jest + TypeORM | Repository queries against test DB |
| E2E | Jest + Supertest | Full HTTP flow per module |

**Per module minimum:**
```
auth.service.spec.ts       ← unit: login, register, token refresh
employees.service.spec.ts  ← unit: CRUD, business rules
leaves.service.spec.ts     ← unit: balance check, overlap check
auth.e2e-spec.ts           ← e2e: full login/logout flow
```

---

## Database Migration Order

Run migrations in this order (respects FK constraints):

```
1. create_users_table
2. create_departments_table
3. create_positions_table
4. create_employees_table
5. create_salary_structures_table
6. create_attendance_table
7. create_leave_types_table
8. create_leave_balances_table
9. create_leave_applications_table
10. create_payroll_batches_table
11. create_payslips_table
12. create_performance_reviews_table
13. create_performance_goals_table
14. create_employee_documents_table
15. create_notifications_table
16. create_audit_logs_table
```

---

## Build Order Summary

```
Phase 1  ✅  Foundation (structure, config, filters, Swagger)
Phase 2      Users + Auth (JWT, RBAC)                         ← START HERE
Phase 3      Departments + Positions
Phase 4      Employees + Documents
Phase 5      Attendance
Phase 6      Leave Management
Phase 7      Payroll
Phase 8      Performance
Phase 9      File Upload + Email + Notifications + Reports
Phase 10     Caching + Rate Limiting + Audit + Migrations
```

Each phase produces working, tested, documented endpoints before moving to the next.
