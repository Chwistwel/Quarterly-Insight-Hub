# Quarterly Insight Hub — Capstone Demo Script

> **Focus: How the system works and how Teacher & Admin roles exchange data.**

---

## INTRODUCTION (1 minute)

**On screen:** Home page at `http://localhost:5173`

**Say this:**

"Good morning/afternoon. Today we are presenting the **Quarterly Insight Hub**, a web-based assessment management system developed for **Kalalake Elementary School** in Olongapo City.

The system solves one main problem: **teachers manually compute item analysis using Excel, and administrators have no way to see school-wide assessment data without collecting files from every teacher.**

Our system connects these two roles in one platform:

- **Teachers** upload exam results and get automatic item analysis
- **Administrators** see merged data across all sections without asking teachers for files

Let me show you how data flows between these two roles.

---

## PART 1 — LOGIN (Role Selection)

**On screen:** `/auth`

**Action:** Show the login page.

**Say this:**

"The system has two user roles. The login page determines who you are.

When you type your email, the system checks the database. If you are a **Teacher**, you see the teacher interface. If you are an **Administrator**, you see the admin interface.

Let me log in as a **teacher** first."

**Action:** Log in as Teacher.

---

## PART 2 — TEACHER SIDE: Dashboard

**On screen:** `/teacher/dashboard`

**Say this:**

"This is the Teacher Dashboard. The teacher can filter by **Grade Level** and **Quarter**.

The KPI cards and charts pull data from the teacher's **uploaded exam results**. If a teacher has not uploaded anything yet, these cards will show zeros or no data.

This is important: **all data starts from the teacher's uploads.** Nothing is hardcoded. The system only shows numbers when the teacher has submitted exam files."

---

## PART 3 — TEACHER UPLOADS EXAM RESULTS (Data Entry Point)

**On screen:** `/teacher/upload-results`

**Action:** Navigate to Upload Results.

**Say this:**

"This is where **data enters the system**.

The teacher selects a **Class**, **Subject**, and **Quarter**, then uploads a CSV or Excel file containing student names and their answers to each test item.

When the teacher clicks **Submit Results**, the system:

1. Reads every student's answer for every item
2. Computes the **Difficulty Index** — how many students got each item correct
3. Computes the **Discrimination Index** — how well each item separates high and low performers
4. Computes the **Reliability** of the whole test using the Spearman-Brown formula
5. Saves all this data to the database

From this moment, the data is available for both the **teacher** and the **admin**.

The teacher can see their results immediately. The admin can see merged data without the teacher sending any file."

---

## PART 4 — TEACHER: Item Analysis (Consuming Uploaded Data)

**On screen:** `/teacher/item-analysis`

**Say this:**

"The teacher now sees the **Item Analysis** page. All the data here comes from the upload we just did.

The table shows each test item with:

- **Difficulty Index** — a number from 0 to 1
- **Difficulty label** — Easy, Average, Difficult
- **Discrimination Index**
- **Interpretation** — Excellent, Good, Fair, or Needs Improvement
- **Decision** — Accept, Revise, or Discard

The teacher can switch to **Individual View** to see how each specific student performed.

At the bottom, the system automatically identifies the **Top 10 Most Learned Items** and **Top 10 Least Learned Items** with suggested interventions.

The teacher can **Save the Analysis**, which links it to a TOS blueprint. This connection is important because it lets the admin see which competencies students are struggling with across all sections."

---

## PART 5 — TEACHER: TOS Builder (Planning Data)

**On screen:** `/teacher/tos-builder/create`

**Say this:**

"The **TOS Builder** is where teachers plan their exams. TOS stands for Table of Specifications — it is a blueprint that maps test items to topics and Bloom's Taxonomy levels.

The teacher enters:

- **Total days** spent teaching
- **Number of items** on the test
- **Bloom's Taxonomy percentages** (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating)

The system then generates a **Blueprint Matrix** table. Each row is a topic with competencies. The teacher can edit how many items go to each Bloom level for each topic.

The **Auto Distribute** button spreads items proportionally across all topics and Bloom levels.

When the teacher clicks **Save TOS**, this blueprint is stored in the database. It becomes available for the **admin** to view later by grade level.

**This is a data exchange point:** The teacher's TOS becomes part of the admin's view, so the school head can see what competencies each grade level is testing."

---

## PART 6 — TEACHER: Student Management (Student Data Entry)

**On screen:** `/teacher/student-management`

**Say this:**

"The **Student Management** page lets the teacher add, edit, or delete students.

The teacher can:

- Add students one by one using the **Add** button
- Upload a whole class list using **Upload Class**
- Download a **template** Excel file with student names and 50 empty item columns

The **Analysis tab** shows uploaded item analysis per quarter, along with the saved TOS for reference.

All student data here is linked to the teacher's class. When the admin views grade-level data, the system pulls from all these student records across all sections."

---

## PART 7 — TEACHER: My Classes (Data Organization)

**On screen:** `/teacher/my-classes`

**Say this:**

"The **My Classes** page shows all classes assigned to this teacher. Each card shows the grade, section, subject, and student count.

This data comes from what the **admin** created on their side. So the data flow is:

- **Admin creates the class** (e.g., Grade 3 — Section A, English)
- **Admin assigns a teacher** to that class
- **Teacher sees the class** appear here

This is the first example of **admin-to-teacher data flow**."

---

## PART 8 — TEACHER: Reports (Data Output)

**On screen:** `/teacher/my-reports`

**Say this:**

"The **Reports** page lets the teacher download the results.

There are five report types:

1. **Executive Summary (Word document)** — A complete, official report with DepEd logos, summary table, item analysis matrix, score summary, top/bottom 10 items, and certification section. Ready for submission.
2. **Item Analysis Matrix (CSV)** — All items with statistics
3. **Class Performance Summary (CSV)**
4. **Student Ranking List (CSV)**
5. **Least Learned With Interventions (CSV)**

All these reports use the data from the teacher's uploaded exam results. No manual typing needed.

Now let me log out and show the **admin** side."

**Action:** Log Out → Log In as Admin.

---

## PART 9 — ADMIN SIDE: School Overview (Consuming Teacher Data)

**On screen:** `/admin/overview`

**Say this:**

"This is the **School Overview**. The admin can filter by **Grade Level** and **Quarter**.

Unlike the teacher dashboard, this page shows data **across all teachers and sections**.

The **KPI cards** show total students and active teachers across the school.

The **charts** show performance by grade level and by subject — all computed from the exam uploads that **teachers** submitted.

The **Grade Level Summary** table shows each grade's average score, number of students, pass rate, and a status badge:

- **Excellent** — 80% and above
- **Good** — 60% to 79%
- **Fair** — 40% to 59%
- **Needs Improvement** — below 40%
- **No Data** — when no teacher has uploaded an exam for that grade

**This is the core data exchange:** The teacher uploaded exam results → the admin sees merged, school-wide statistics without asking for any file.

The system does the aggregation automatically. If there are two sections of Grade 3 — Section A and Section B — their results are merged together on the admin side."

---

## PART 10 — ADMIN: Item Analysis (Merged Teacher Data)

**On screen:** `/admin/item-analysis`

**Say this:**

"The **Admin Item Analysis** page is where the data exchange is most visible.

The admin selects a **Grade**, **Subject**, and **Quarter**. The system then:

1. Finds all teachers who uploaded exams for that grade, subject, and quarter
2. Merges all student results across all sections
3. Shows the **merged item analysis**

The KPI cards — Average Score, Average Index, Total Students — are weighted averages across all sections.

The item analysis table shows the same format as the teacher's, but the numbers reflect the **whole grade level**, not just one section.

For example, if the difficulty index of Item 1 is 0.75 in Section A and 0.65 in Section B, the admin sees a merged difficulty index that combines both.

Below, the **TOS section** shows the Table of Specifications for this grade level. The system finds the TOS saved by any teacher for this grade, subject, and quarter.

The **Top 10 Most Learned** and **Least Learned** tables also reflect data across all sections.

**This gives the administrator power:** They can see which test items work well across the whole grade, without collecting a single file from teachers."

---

## PART 11 — ADMIN: Teacher Performance (Teacher Data Aggregation)

**On screen:** `/admin/teacher-performance`

**Say this:**

"The **Teacher Performance** page computes each teacher's average score and pass rate based on their **uploaded exam results**.

The system:

1. For each teacher, finds all their uploaded exams
2. For each student in each upload, computes their percentage score (total correct ÷ total items × 100)
3. Averages these percentages across all quarters and classes

After our fix, these scores are only computed from actual uploads. If a teacher has not uploaded any exam, their score shows zero.

The table also shows **Upload Status** — whether the teacher submitted on time or late, based on the quarter schedule.

The bar chart shows **Performance by Department** — comparing different subject areas.

**Data flow:** Teacher uploads exam → System computes student percentages → Admin sees aggregated teacher performance."

---

## PART 12 — ADMIN: Teachers & Classes (Admin Creates, Teacher Consumes)

**On screen:** `/admin/teachers`

**Say this:**

"The **Teachers** page shows all teacher accounts. The admin can:

- **Add Teacher** — creates a new teacher account with login credentials
- **Edit** — updates teacher information
- **Delete** — removes a teacher

Each card shows the teacher's average score and pass rate, computed from their uploads.

**On screen:** `/admin/all-classes`

The **All Classes** page lets the admin create and manage classes. When creating a class, the admin selects:

- **Grade Level** (1 to 6)
- **Section**
- **Subject**
- **Teacher** (from the dropdown of existing teachers)

**Data flow:**

1. Admin creates teacher account → Teacher can log in
2. Admin creates class and assigns teacher → Teacher sees it in 'My Classes'
3. Teacher uploads exam results → Admin sees aggregated data

This completes the data cycle."

---

## PART 13 — ADMIN: Reports (Consolidated Output)

**On screen:** `/admin/all-reports`

**Say this:**

"The **Admin Reports** page generates school-wide reports.

The **Executive Summary (DOCS)** downloads a Word document with data from all sections combined.

The **Item Analysis Matrix (CSV)** and **Class Performance Summary (CSV)** contain merged data across the selected grade level.

These reports are the **final output** of the system — they take all the data teachers have uploaded and produce consolidated reports the school head can use for decision-making."

---

## PART 14 — DATA FLOW SUMMARY

**Say this:**

"Let me summarize the **data exchange between Teacher and Admin roles**:

```
Admin creates Teacher Account
         │
         ▼
Admin creates Class + assigns Teacher
         │
         ▼
Teacher logs in → sees their classes
         │
         ├──► Teacher builds TOS (test blueprint)
         │         │
         │         ▼
         │    Admin can view TOS per grade level
         │
         ├──► Teacher uploads exam results (CSV/Excel)
         │         │
         │         ▼
         │    System computes: Difficulty Index,
         │    Discrimination Index, Reliability
         │         │
         │         ├──► Teacher sees Item Analysis for their class
         │         ├──► Teacher downloads reports (per class)
         │         │
         │         ▼
         │    Admin sees merged analysis across all sections
         │    Admin sees teacher performance scores
         │    Admin downloads school-wide reports
         │
         └──► Teacher manages students
                   │
                   ▼
              Admin sees total students per grade
```

The key points:

1. **Teachers are the data source** — they upload exam results
2. **The system automatically computes** all statistics — no manual calculation
3. **The admin sees merged data** — no need to collect files from teachers
4. **Both roles can generate reports** — teacher for their class, admin for the whole school
5. **The connection between roles** is managed through the Admin's ability to create teacher accounts and classes, and the system's ability to aggregate uploads by grade level

---

## CONCLUSION (30 seconds)

**Say this:**

"The **Quarterly Insight Hub** connects teachers and administrators in a single platform. Teachers do their work — upload exams, analyze items, build TOS — and the system automatically makes that data available to administrators in an aggregated, meaningful way.

This eliminates manual file collection, removes duplicate data entry, and gives the school leadership real-time visibility into assessment quality across all grade levels.

Thank you. We are ready for your questions."
