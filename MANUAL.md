# Quarterly Insight Hub — User & Technical Manual

---

# Part I: User Manual

## 1. Introduction

**Quarterly Insight Hub** (QIH) is a web-based assessment management system designed for **KALALAKE ELEMENTARY SCHOOL** under the Department of Education — Region III, Division of Olongapo. It streamlines the entire assessment cycle from Table of Specifications (TOS) construction through item analysis, student performance tracking, and report generation.

The system serves two roles:

| Role | Responsibilities |
|------|------------------|
| **Teacher** | Build TOS, upload exam results, analyze test items, manage students, generate reports |
| **Administrator** | Oversee school-wide performance, manage teacher/class accounts, generate consolidated reports |

---

## 2. Getting Started

### 2.1 Accessing the System

Open a modern web browser (Chrome, Firefox, Edge) and navigate to the system URL. The application is a Progressive Web App (PWA) and can be installed to your device's home screen for offline-capable access.

### 2.2 Logging In

1. Go to the **Sign In** page.
2. Enter your **username** or **email**. Teachers and admins can log in with either:
   - Full email (e.g., `juan.delacruz@kalalake.edu.ph`)
   - Username only (the `@kalalake.edu.ph` domain is appended automatically)
3. Enter your **password**.
4. Click **Sign In**.

> Default admin credentials (for initial setup):
> - Username: `admin`
> - Password: `password123`

### 2.3 Navigation

After logging in, you are redirected to your role's dashboard:

- **Teachers** see a sidebar with: Dashboard, Analysis Tools (Item Analysis, TOS Builder), Classes (My Classes, Student Management, Upload Results), Reports (My Reports).
- **Administrators** see a sidebar with: School Overview, Teachers, All Classes, Item Analysis, Teacher Performance, All Reports.

The top header bar includes:
- Theme toggle (light/dark mode)
- User menu with profile info and **Sign Out**

### 2.4 Logging Out

Click your name in the top-right header and select **Sign Out**.

---

## 3. Teacher Guide

### 3.1 Dashboard

The teacher dashboard displays key performance indicators:

- **Class Average** — mean score across your classes
- **Average Index** — mean discrimination index
- **Total Students** — number of students assessed
- **Items Analyzed** — number of test items processed

Use the **Grade Level** and **Quarter** filters to narrow the view. The trend chart shows performance over time, and the **Top Students** section lists highest-ranking students.

### 3.2 Building a Table of Specifications (TOS)

The TOS Builder helps you plan assessments aligned with Bloom's Taxonomy.

**To create a TOS:**
1. Go to **Analysis Tools → TOS Builder**.
2. Select your **Class**, **Subject**, and **Quarter**.
3. Click **Create New TOS**.
4. Add rows with:
   - **Topic** — the subject topic
   - **Competency** — the learning competency
   - **Days** — number of teaching days
   - **Percentage** — weight for this competency
   - **Bloom's Taxonomy counts** — number of items per cognitive level (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating)
5. The system automatically calculates **Total Items** and validates that percentages sum to 100%.
6. Click **Save Draft** to store locally, or **Save TOS** to persist to the server.

**To load an existing TOS:**
1. Select the same **Class**, **Subject**, and **Quarter**.
2. Click **Load Blueprint** to fetch the saved version.

### 3.3 Uploading Exam Results

1. Go to **Classes → Upload Results**.
2. Select the **Class**, **Subject**, and **Quarter**.
3. Upload a **CSV or Excel file** containing:
   - Column A: Student names
   - Subsequent columns: Item responses (correct/incorrect per item)
4. Click **Upload & Compute**.
5. The system processes the file and displays:
   - **Item Difficulty Index** (0.00–1.00): proportion of students answering correctly
   - **Item Discrimination Index** (0.00–1.00): how well an item distinguishes high from low performers
   - **Reliability Coefficient** — overall test reliability
   - **Per-student results** with scores and rankings

**File format requirements:**
- First row should contain headers
- First column: student names
- Subsequent columns: 1 for correct, 0 for incorrect (or any numeric scoring)
- Maximum file size: 5 MB

### 3.4 Item Analysis

1. Go to **Analysis Tools → Item Analysis**.
2. Select **Class**, **Subject**, and **Quarter**.
3. View the item analysis table with columns:
   - **Item #** — item number
   - **Difficulty Index** — proportion correct (0.00–1.00)
   - **Difficulty Label** — Very Easy, Easy, Moderately Difficult, Difficult, Very Difficult
   - **Discrimination Index** — discrimination power
   - **Result** — correct/total format
   - **Interpretation** — Excellent, Good, Fair, Needs Improvement
   - **Decision** — whether to accept, revise, or discard the item

**Linking TOS to Item Analysis:**
- Click **Link TOS** to map each item to a content area from your TOS.
- This enables the **Most Learned** and **Least Learned** reports.

### 3.5 Student Management

1. Go to **Classes → Student Management**.
2. Select a class to view its roster.
3. You can:
   - **Add a student** manually (name, section, subject, quarterly scores)
   - **Edit** student records
   - **Delete** students
   - **Upload a class list** via CSV/Excel (bulk import)

### 3.6 Generating Reports

1. Go to **Reports → My Reports**.
2. Select **Class**, **Subject**, and **Quarter**.
3. Available reports:

| Report | Format | Description |
|--------|--------|-------------|
| Executive Summary | Word (.doc) | Complete item analysis with school header, summary table, score distribution, most/least learned items, certification |
| Item Analysis Matrix | CSV | Per-item difficulty, discrimination, decision |
| Class Performance Summary | CSV | Averages, MPS, pass/fail counts |
| Student Ranking List | CSV | Ranked student list with scores |
| Least Learned w/ Interventions | CSV | Bottom 10 items with suggested interventions |

---

## 4. Administrator Guide

### 4.1 School Overview

Go to **School Overview** to view school-wide analytics:

- **KPIs**: School Average, Overall Pass Rate, Total Students, Active Teachers
- **Grade Performance**: Bar chart showing average score per grade level
- **Subject Performance**: Bar chart showing average score per subject
- **Grade Summary Table**: Each grade level listed with average score, student count, pass rate, and status badge (Excellent ≥ 85, Good ≥ 75, Fair ≥ 60, Needs Improvement < 60, or No Data if no uploads exist)

Use the **Grade Level** and **Quarter** filters to focus the view.

### 4.2 Managing Teacher Accounts

1. Go to **Teachers**.
2. View all teachers in card layout with subject, classes, average score, pass rate.
3. **Add a teacher**: Click **Create Teacher**, fill in first name, last name, email, and password.
4. **Edit**: Click the edit button on a teacher card.
5. **Delete**: Click the delete button (confirmation required).

### 4.3 Managing Classes

1. Go to **All Classes**.
2. View all class sections in a table.
3. **Add a class**: Specify grade level, section, subject, and teacher.
4. **Edit/Delete**: Use the action buttons on each row.

### 4.4 Item Analysis (Admin)

1. Go to **Item Analysis**.
2. Select **Grade Level**, **Subject**, and **Quarter**.
3. View merged item analysis across all sections of that grade.
   - The system aggregates student results from all teachers' uploads within the same grade, subject, and quarter.
   - Difficulty and discrimination averages are weighted by student count.
4. Filter items by status: **All Items**, **Excellent**, **Good**, **Needs Improvement**.
5. The **Saved TOS** section displays the Table of Specifications for the selected grade/subject/quarter (loaded from any teacher's saved TOS).
6. **Most Learned / Least Learned** tables show top and bottom 10 items with content areas from the TOS.
7. Download reports via **All Reports** page.

### 4.5 Teacher Performance Analytics

1. Go to **Teacher Performance**.
2. View KPIs: Total Teachers, Average Teacher Score, On-Time Uploads %, Top Performer.
3. **Department Bars** — average score grouped by subject.
4. **Teacher Table** — each teacher listed with:
   - Subject, number of classes, total students
   - Average Score and Pass Rate (calculated from their uploaded assessment data across all quarters)
   - Upload Status (On Time if they have at least one upload, Delayed otherwise)

### 4.6 All Reports (Admin)

1. Go to **All Reports**.
2. Select **Grade**, **Subject**, and **Quarter**.
3. Generate:
   - **Executive Summary (DOCS)** — Word document with the complete item analysis report
   - **Item Analysis Matrix** — CSV with per-item statistics
   - **Class Performance Summary** — CSV with grade-level performance totals

---

## 5. Understanding Status Indicators

### 5.1 Item Difficulty Labels

| Difficulty Index | Label |
|-----------------|-------|
| ≥ 0.85 | Very Easy |
| ≥ 0.70 | Easy |
| ≥ 0.45 | Moderately Difficult |
| ≥ 0.20 | Difficult |
| < 0.20 | Very Difficult |

### 5.2 Item Discrimination Labels

| Discrimination Index | Label |
|--------------------|-------|
| ≥ 0.40 | Very Discriminating |
| ≥ 0.30 | Discriminating |
| ≥ 0.20 | Moderately Discriminating |
| ≥ 0.00 | Slightly Discriminating |
| < 0.00 | Not Discriminating |

### 5.3 Item Decisions

| Difficulty | Discrimination | Decision |
|-----------|---------------|----------|
| ≥ 0.85 | ≥ 0.40 | Accepted as it is |
| ≥ 0.70 | ≥ 0.30 | Accepted with very slight revision |
| ≥ 0.45 | ≥ 0.20 | Accepted with slight revision |
| ≥ 0.20 | ≥ 0.10 | May be accepted with minor revision |
| ≥ 0.20 | ≥ 0.00 | Major revision on stem or choices |
| ≥ 0.05 or disc ≥ -0.05 | | Needs major revision or may be discarded |
| < 0.05 and < -0.05 | | Totally discard |

### 5.4 Grade Summary Status

| Average Score | Status | Badge Color |
|--------------|--------|-------------|
| ≥ 85 | Excellent | Green |
| ≥ 75 | Good | Blue |
| ≥ 60 | Fair | Yellow |
| < 60 | Needs Improvement | Red |
| No upload data | No Data | Gray |

---

# Part II: Technical Manual

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vite + React)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Teacher  │  │   Admin  │  │  Public  │  │ Shared │ │
│  │  Pages    │  │  Pages   │  │  Pages   │  │  Comp  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       └──────────────┴──────────────┴────────────┘      │
│                         │                               │
│              ┌──────────┴──────────┐                    │
│              │   teacherPortalApi  │                    │
│              │   + fetchJson       │                    │
│              └──────────┬──────────┘                    │
├─────────────────────────┼───────────────────────────────┤
│                    HTTP (REST API)                      │
├─────────────────────────┼───────────────────────────────┤
│                    Backend (Express)                    │
│              ┌──────────┴──────────┐                    │
│              │     server.ts       │                    │
│              │  (Auth + All APIs)  │                    │
│              └──────────┬──────────┘                    │
│                         │                               │
│              ┌──────────┴──────────┐                    │
│              │     Prisma ORM      │                    │
│              └──────────┬──────────┘                    │
├─────────────────────────┼───────────────────────────────┤
│                  PostgreSQL Database                    │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌───────────────┐ │
│  │ Admin  │  │ Teacher│  │Student │  │TeacherItemAna │ │
│  │        │  │        │  │        │  │lysis + TOS    │ │
│  └────────┘  └────────┘  └────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 6.1 Frontend

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Routing**: React Router DOM 7 (browser router)
- **HTTP Client**: Native `fetch` via `fetchJson` helper
- **File Processing**: `xlsx` library for Excel parsing
- **PWA**: `vite-plugin-pwa` with service worker (NetworkFirst for API routes, CacheFirst for static assets)

### 6.2 Backend

- **Runtime**: Node.js with Express 5
- **Language**: TypeScript (compiled via tsx for development)
- **ORM**: Prisma 6 with PostgreSQL
- **File Upload**: Multer (5 MB limit)
- **Spreadsheet Processing**: `xlsx` library
- **Password Hashing**: Node.js `crypto.scryptSync` with random salt

### 6.3 Database

- **Provider**: PostgreSQL
- **ORM**: Prisma (schema-driven migrations)
- **Models**: 9 tables (Administrator, Teacher, ClassSection, Student, TosBlueprint, TosBlueprintHistory, TeacherItemAnalysis, TeacherUploadMeta, TeacherReport)

---

## 7. Installation & Setup

### 7.1 Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** or **pnpm**

### 7.2 Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd Quarterly-Insight-Hub

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 7.3 Database Setup

1. Create a PostgreSQL database.
2. Copy the connection string to `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
PORT=5000
```

3. Run Prisma migrations:

```bash
cd backend
npx prisma migrate dev --name init
```

4. Seed the admin account (optional, for development):

```bash
node create-admin-acc-script.js
```

### 7.4 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `PORT` | No | `5000` | Backend server port |
| `USE_IN_MEMORY_AUTH_FALLBACK` | No | `true` | Allow in-memory auth when DB is unavailable |

### 7.5 Running in Development

```bash
# Terminal 1: Backend
cd backend
npx tsx server.ts

# Terminal 2: Frontend
cd frontend
npm run dev
```

The frontend runs on `http://localhost:5173` (Vite dev server) and proxies API calls to `http://localhost:5000` (Express).

### 7.6 Building for Production

```bash
cd frontend
npm run build   # outputs to frontend/dist/
```

Serve the `dist/` folder with any static file server (Nginx, Apache, etc.) and configure reverse proxy for `/api/` routes to the Express backend.

---

## 8. Database Schema

### 8.1 Entity Relationship

```
Administrator ──┐
                │
Teacher ────────┼── hasMany ──> ClassSection
                │
Student ────────┘              │
                               ├── hasMany ──> TeacherItemAnalysis
TosBlueprint ──────────────────┤
TosBlueprintHistory ───────────┤
TeacherUploadMeta ─────────────┘
TeacherReport
```

### 8.2 Core Models

**Administrator**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| firstName | String | |
| lastName | String | |
| email | String | Unique |
| passwordHash | String | `salt:hash` format from scryptSync |

**Teacher**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| firstName, lastName | String | |
| email | String | Unique |
| passwordHash | String | |
| subject | String | Primary subject |
| className | String | Assigned class label |
| averageScore | Float | Computed, updated on upload |
| passRate | Float | Computed, updated on upload |

**ClassSection**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| className | String | |
| gradeLevel | String | e.g., "Grade 3" |
| section | String | e.g., "Section A" |
| subject | String | |
| teacherName | String | Display name of teacher |
| studentCount | Int | |

**Student**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| classId | String | FK to ClassSection |
| teacherEmail | String | |
| name, firstName, lastName | String | |
| gender | String | |
| grade, section, subject | String | |
| q1Score–q4Score | Float | Quarterly scores (0–100) |
| ranking | Int | Computed rank within class |

**TeacherItemAnalysis**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| class | String | Class label |
| subject | String | |
| quarter | String | e.g., "First", "Second" |
| teacherEmail | String | |
| timestamp | DateTime | Upload time |
| summary | Json | `{ totalItems, avgDifficulty, avgDiscrimination, reliability }` |
| items | Json | Array of item objects with difficulty, discrimination, interpretation |
| studentResults | Json | Array of `{ studentName, totalScore, rank }` |
| studentItemResults | Json | Per-student per-item results |
| studentIdentityLinks | Json | Matched student IDs |
| totalStudents | Int | |

**TosBlueprint**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| teacherEmail | String | |
| schoolYear | String | e.g., "2025-2026" |
| quarter | String | |
| classValue | String | Class label |
| subject | String | |
| totalDays, totalItems, objectiveCount | Int | |
| bloomWeights | Json | `{ remembering: N, understanding: N, ... }` |
| rows | Json | Array of TOS row objects |
| latestHistoryVersion | Int | |

---

## 9. API Reference

### 9.1 Authentication

All authenticated endpoints require two headers:
```
x-user-role: teacher | administrator
x-user-email: user@kalalake.edu.ph
```

### 9.2 Authentication Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login, returns `{ user: { id, role, firstName, lastName, email } }` |

**Login Request Body:**
```json
{
  "email": "teacher@kalalake.edu.ph",
  "password": "secret123"
}
```

### 9.3 Teacher Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/dashboard` | KPIs, trends, top students |
| GET | `/teacher/item-analysis?class=&subject=&quarter=` | Item analysis data |
| DELETE | `/teacher/item-analysis` | Delete analysis records |
| GET | `/teacher/upload-meta` | Grade levels, subjects, quarters for dropdowns |
| GET | `/teacher/tos?schoolYear=&classValue=&subject=&quarter=` | Get saved TOS blueprint |
| POST | `/teacher/tos` | Save/create TOS blueprint |
| GET | `/teacher/tos/options` | Available TOS combinations |
| GET | `/teacher/tos/history` | TOS version history |
| DELETE | `/teacher/tos/history/:historyId` | Delete TOS history entry |
| GET | `/teacher/reports` | Reports metadata |
| GET | `/teacher/my-classes` | Teacher's assigned classes |
| DELETE | `/teacher/my-classes/:classId` | Delete a class |
| GET | `/teacher/students?classId=` | List students |
| POST | `/teacher/students` | Add student |
| PUT | `/teacher/students/:studentId` | Update student |
| DELETE | `/teacher/students/:studentId` | Delete student |
| POST | `/teacher/students/upload-class-list` | Bulk import students |

### 9.4 Admin Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/teachers` | Create teacher account |
| GET | `/api/admin/school-overview?gradeLevel=&quarter=` | School-wide KPIs and grade summary |
| GET | `/api/admin/teacher-performance` | Teacher performance analytics |
| GET | `/api/admin/item-analysis?class=&subject=&quarter=` | Grade-level item analysis |
| GET | `/api/admin/teachers` | List all teachers |
| PUT | `/api/admin/teachers/:teacherId` | Update teacher |
| DELETE | `/api/admin/teachers/:teacherId` | Delete teacher |
| GET | `/api/admin/classes` | List all classes |
| POST | `/api/admin/classes` | Create class |
| PUT | `/api/admin/classes/:classId` | Update class |
| DELETE | `/api/admin/classes/:classId` | Delete class |
| GET | `/api/admin/tos?schoolYear=&quarter=&classValue=&subject=` | View TOS blueprints |

### 9.5 Computation Endpoint

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/item-analysis/compute` | Upload file (form-data with `file` field) and compute item analysis |

### 9.6 Response Formats

**School Overview Response:**
```json
{
  "kpis": {
    "schoolAverage": 78.5,
    "overallPassRate": 72.3,
    "totalStudents": 450,
    "activeTeachers": 12
  },
  "gradeOptions": [{ "id": "Grade 3", "label": "Grade 3" }],
  "gradeBars": [{ "label": "Grade 3", "value": 78 }],
  "subjectBars": [{ "label": "English", "value": 82 }],
  "gradeSummary": [{
    "gradeLevel": "Grade 3",
    "averageScore": 78.5,
    "students": 120,
    "passRate": 75.0,
    "status": "Good"
  }]
}
```

**Teacher Performance Response:**
```json
{
  "kpis": {
    "totalTeachers": 15,
    "avgTeacherScore": 76.2,
    "onTimeUploadsPercent": 80,
    "onTimeUploadsCount": 12,
    "topPerformerName": "Juan Dela Cruz",
    "topPerformerScore": 92.5
  },
  "departmentBars": [{ "label": "English", "value": 82 }],
  "teachers": [{
    "id": "...",
    "name": "Juan Dela Cruz",
    "subject": "English",
    "classes": 3,
    "students": 95,
    "avgScore": 85.3,
    "passRate": 78.9,
    "uploadStatus": "On Time"
  }]
}
```

**Item Analysis Response:**
```json
{
  "title": "Item Analysis - Grade 3",
  "gradeOptions": ["Grade 3"],
  "gradeSubjectMap": { "Grade 3": ["English", "Math"] },
  "selectedGrade": "Grade 3",
  "selectedSubject": "English",
  "selectedQuarter": "First",
  "classAverage": "78.5%",
  "averageIndex": "0.45%",
  "totalStudents": 45,
  "rows": [{
    "itemNo": 1,
    "difficultyIndex": 0.85,
    "difficultyLabel": "Very Easy",
    "discriminationIndex": 0.42,
    "result": "38/45",
    "interpretation": "Excellent",
    "decision": "Accepted as it is",
    "status": "excellent"
  }]
}
```

---

## 10. Authentication & Security

### 10.1 Authentication Flow

1. User submits credentials via `POST /api/auth/login`.
2. Backend searches for the user in the `Administrator` or `Teacher` table (by email).
3. Password is verified using `crypto.timingSafeEqual` against `scryptSync`-derived hash.
4. On success, the server returns user info (id, role, firstName, lastName, email).
5. The frontend stores these in `localStorage` (`userRole`, `userEmail`, `userProfile`).
6. Every subsequent API call includes `x-user-role` and `x-user-email` headers.
7. Each endpoint validates these headers and checks authorization.

### 10.2 Security Considerations

- **No session tokens or JWT** — authentication is per-request via headers.
- **Passwords hashed** with `scryptSync` (CPU/memory-hard), 16-byte salt, 64-byte derived key.
- **Timing-safe comparison** prevents timing side-channel attacks.
- **CORS** restricts origins to known domains (localhost, production domains).
- **File upload** limited to 5 MB, processed synchronously.
- **Self-signup is disabled** — accounts must be created by an administrator.

---

## 11. Item Analysis Computation

### 11.1 Upload Processing Pipeline

```
Upload CSV/Excel
       │
       ▼
Parse file (xlsx library)
       │
       ▼
Compute per-student scores
  - Count correct answers per student
  - Rank students by total score
       │
       ▼
Compute per-item statistics
  - Difficulty Index  = correctCount / totalStudents
  - Discrimination Index = (top27% correct - bottom27% correct) / groupSize
  - Reliability (split-half method with Spearman-Brown correction)
       │
       ▼
Store results in TeacherItemAnalysis table
  - summary, items, studentResults, studentItemResults
       │
       ▼
Return computed analysis to frontend
```

### 11.2 Key Formulas

**Difficulty Index** (0.00–1.00):
```
Difficulty = (Number of students answering correctly) / (Total number of students)
```

**Discrimination Index** (-1.00–1.00):
```
Top 27%  = highest-scoring 27% of students
Bottom 27% = lowest-scoring 27% of students

Discrimination = (TopCorrectRate) - (BottomCorrectRate)
```

**Reliability** (split-half, Spearman-Brown corrected):
```
Split items into odd/even halves
r = correlation between odd-half and even-half scores
Reliability = (2 * r) / (1 + r)
```

### 11.3 Teacher Performance (Admin)

Teacher average score and pass rate are computed from uploaded assessment data only:

```
Per student per upload:  studentPercent = (totalScore / totalItems) × 100
Per student overall:     studentAvg = mean of studentPercent across all uploaded quarters
Class avgScore:          mean of all studentAvgs in that class
Class passRate:          (% of students with studentAvg ≥ 75) × 100

Teacher avgScore:  weighted mean of class avgScores (weighted by student count)
Teacher passRate:  weighted mean of class passRates (weighted by student count)
```

Only quarters with uploaded data are included. When a new quarter is uploaded, the calculation adjusts automatically.

### 11.4 Grade-Level Aggregation (Admin)

For the admin Item Analysis view, when a grade level is selected (e.g., "Grade 3"), the system:

1. Finds all teacher uploads across all sections of that grade.
2. Merges `studentItemResults` from all sections.
3. Computes combined correct/total counts per item across the entire grade.
4. Averages difficulty and discrimination weighted by student count per section.

---

## 12. Deployment

### 12.1 Production Build

```bash
# Build frontend
cd frontend
npm run build

# Output: frontend/dist/
```

### 12.2 Server Deployment

**Option A: Standalone Node.js**
```bash
cd backend
npm install --production
npx prisma generate
npx tsx server.ts
```

**Option B: Process Manager (PM2)**
```bash
npm install -g pm2
cd backend
pm2 start --interpreter tsx server.ts --name qih-backend
pm2 save
pm2 startup
```

### 12.3 Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/frontend/dist;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /teacher/ {
        proxy_pass http://127.0.0.1:5000;
    }

    # Static files with caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # PWA service worker (no cache)
    location /sw.js {
        add_header Cache-Control "no-cache";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 12.4 Environment-Specific Configuration

| Environment | Typical URL | Notes |
|-------------|-------------|-------|
| Development | `http://localhost:5173` | Vite dev server with HMR |
| Production | `https://your-domain.com` | Built files served via Nginx |

Update the `corsOrigins` array in `server.ts` to include your production domain.

---

## 13. Troubleshooting

### 13.1 Common Issues

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| "Database is unreachable" | PostgreSQL not running or wrong DATABASE_URL | Check connection string, ensure DB is accessible |
| "Unable to load item analysis" | No uploads for selected grade/subject/quarter | Verify teacher has uploaded data |
| Login fails | Wrong credentials or account doesn't exist | Check email format (use `@kalalake.edu.ph`), verify account exists |
| File upload fails | File too large (>5 MB) or wrong format | Use CSV or Excel, check file size |
| TOS not found in admin | Grade-level mismatch (TOS saved per section, admin queries by grade) | Admin view shows first matching TOS for the grade |
| Reports show 0 students | totalStudents not saved during upload | Re-upload the file to populate totalStudents |

### 13.2 Logs

Backend logs errors to console. In production, redirect output to a file:
```bash
pm2 start --interpreter tsx server.ts --name qih-backend -l logs/app.log
```

---

## 14. Data Migration

The `backend/scripts/migrate-mongo-to-postgres.ts` script handles migration from MongoDB to PostgreSQL:

```bash
cd backend
npx tsx scripts/migrate-mongo-to-postgres.ts
```

This migrates: administrators, teachers, class sections, students, TOS blueprints & history, item analysis records, upload meta, and reports.

---

*Document generated for Quarterly Insight Hub v1.0*
*KALALAKE ELEMENTARY SCHOOL — Department of Education, Region III*
