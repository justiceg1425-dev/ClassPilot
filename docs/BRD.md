# Business Requirements Document
## Classroom Planning & Management Platform (working title: "ClassPilot")

---

## 1. Document Control

| Field | Value |
|---|---|
| Document type | Business Requirements Document (BRD) |
| Version | 0.1 (Draft) |
| Author | Justice |
| Date | 4 September 2026 |
| Status | Draft for review |
| Purpose | Personal learning / portfolio project — non-commercial |

**Revision history**

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | 2026-09-04 | Justice | Initial draft |

---

## 2. Executive Summary

Primary and elementary school teachers spend a significant portion of their working week on planning and administration: building timetables, writing daily lesson objectives, mapping units to curriculum standards, recording grades, tracking attendance, and producing report cards for parents. These tasks are typically spread across spreadsheets, paper planners, word processor templates, and school-issued systems that do not talk to each other.

This project proposes a single, connected platform — delivered as a responsive web application and a companion mobile app — where a teacher can plan their year, run their day, track their students, and produce parent-facing documents from one dataset entered once.

The platform is being built as a personal learning and portfolio exercise. It is not intended for commercial distribution, and it will not process real student data in its reference deployment.

---

## 3. Background & Problem Statement

### 3.1 Current state

A typical primary teacher maintains:

- A weekly timetable in a spreadsheet or on paper
- A daily plan book, often handwritten or in a word processor
- A separate set of unit/lesson plan documents
- A curriculum checklist provided by the education authority
- A gradebook, usually a spreadsheet
- An attendance register, often in the school's own MIS
- Report card templates that require manual re-entry of grades and comments

### 3.2 Pain points

| ID | Pain point | Impact |
|---|---|---|
| PP-01 | The same information is re-entered in three or four places | Time loss, transcription errors |
| PP-02 | Curriculum standards live outside the planning tool | Coverage gaps go unnoticed until late in the year |
| PP-03 | Report cards are assembled manually from the gradebook | Multiple hours per reporting period, per class |
| PP-04 | Multi-grade and multi-school teaching is poorly supported by generic tools | Duplicated planning effort |
| PP-05 | Rotating workshop/centre groups are hard to schedule and track | Manual redrawing of group rotations each week |
| PP-06 | Planning artefacts are not portable between devices or classrooms | Teacher tied to one machine |

### 3.3 Learning objectives (project-specific)

Because this is a learning build, the following are explicit secondary objectives:

- LO-01: Design and implement a non-trivial relational data model with genuine temporal complexity (academic years, terms, weeks, recurring schedule slots).
- LO-02: Build a shared API consumed by both a web front end and a native/cross-platform mobile client.
- LO-03: Implement offline-tolerant behaviour on mobile with conflict resolution on sync.
- LO-04: Produce a testable system — requirements written so that each one maps to at least one automated check.
- LO-05: Exercise document generation (PDF report cards) and scheduled/background processing.

---

## 4. Business Objectives & Success Criteria

| ID | Objective | Success measure |
|---|---|---|
| OBJ-01 | Enter each piece of information once and reuse it everywhere | A lesson created in a unit plan appears in the daily schedule with zero re-entry |
| OBJ-02 | Reduce time to produce a class set of report cards | Report cards for a 30-student class generated in under 5 minutes of teacher effort |
| OBJ-03 | Make curriculum coverage visible | Teacher can see, at any point in the year, which standards are untouched |
| OBJ-04 | Support non-standard teaching contexts as first-class cases | Multi-grade, multi-school and co-teaching supported without workarounds |
| OBJ-05 | Work on a phone in the classroom, not just a laptop at home | Core daily-use screens usable one-handed on a mobile device |
| OBJ-06 | Demonstrate a production-grade engineering approach | Full requirement-to-test traceability; CI pipeline green on main |

---

## 5. Scope

### 5.1 In scope — Phase 1 (MVP)

- User account creation and authentication
- School, academic year, term and class setup
- Student roster management
- Weekly timetable builder
- Daily schedule with objectives and session notes
- Gradebook (numeric and scale-based)
- Responsive web application
- Mobile application (read-optimised for daily schedule, attendance and quick grade entry)

### 5.2 In scope — Phase 2

- Unit plans and lesson plans
- Curriculum standards library, pre-populated and customisable
- Curriculum mapping by term/week
- Achievement/competency tracking books
- Report card generation and export to PDF

### 5.3 In scope — Phase 3

- Attendance register
- Class events calendar
- Parent-teacher meeting scheduling
- Class budget tracker
- Photo directory and class demographics (age distribution)
- Workshop/centre rotation planner
- Co-teacher collaboration on a shared class
- Optional AI assistance for drafting lesson descriptions and report card comments

### 5.4 Out of scope

| ID | Item | Rationale |
|---|---|---|
| OOS-01 | Payment processing, subscriptions and billing | Non-commercial project; tiering will be simulated with feature flags only |
| OOS-02 | Parent-facing login portal | Parents receive exported documents; no parent accounts in any phase |
| OOS-03 | Student-facing accounts | Not required for the teacher-first use case |
| OOS-04 | Integration with any real school MIS or government reporting system | No access; no legitimate test environment |
| OOS-05 | Processing of real, identifiable student data | Reference deployment uses synthetic data only |
| OOS-06 | Native desktop application | Responsive web covers the desktop case |
| OOS-07 | Multi-language localisation beyond English | Architecture will not preclude it, but no second locale will be shipped |
| OOS-08 | Whole-school administration (principal dashboards, staff management) | The unit of scope is the teacher, not the institution |

---

## 6. Stakeholders & Users

### 6.1 Stakeholders

| Role | Interest |
|---|---|
| Project owner / developer | Delivery, learning objectives, portfolio value |
| Reviewer (peer / teacher contact) | Realism of the workflows and terminology |

### 6.2 User personas

**P1 — Single-grade classroom teacher (primary persona)**
Teaches one class of ~28 students, one grade level, all subjects. Wants their week planned, their day visible, and report cards to stop consuming weekends. Moderate technical confidence. Uses a laptop at home and a phone in class.

**P2 — Multi-grade teacher**
Teaches a combined class spanning two or three grade levels in one room. Needs the same time slot to carry different objectives and different standards per grade group. Currently maintains parallel planning documents.

**P3 — Peripatetic / multi-school teacher**
Teaches at two or three schools across the week, with a different class and timetable at each. Needs fast context switching and strict separation of data between schools.

**P4 — Co-teacher**
Shares a single class with another teacher on a job-share or team-teaching basis. Both need to plan into the same timetable and see each other's entries.

---

## 7. Assumptions, Constraints & Dependencies

### 7.1 Assumptions

| ID | Assumption |
|---|---|
| AS-01 | A teacher belongs to one or more schools; a class belongs to exactly one school |
| AS-02 | An academic year is divided into terms/periods, and terms into weeks |
| AS-03 | A timetable is defined per class and repeats weekly, with the ability to override individual days |
| AS-04 | Class sizes will not exceed 40 students; a teacher will not manage more than 6 classes |
| AS-05 | Curriculum standards are hierarchical (subject → strand → standard) and can be authored by the user |
| AS-06 | The teacher is the sole owner of their data and may export or delete it at any time |

### 7.2 Constraints

| ID | Constraint |
|---|---|
| CN-01 | Single developer; delivery is phased and time-boxed |
| CN-02 | Hosting on a low-cost tier; the design must not assume horizontal scale |
| CN-03 | No budget for paid third-party curriculum content; standards data must be authored or sourced from openly licensed material |
| CN-04 | No access to real teachers for structured user testing; requirements are inferred and must be flagged as such |

### 7.3 Dependencies

| ID | Dependency |
|---|---|
| DP-01 | An identity/authentication provider or a self-built auth module |
| DP-02 | A PDF generation library or service for report cards and printable plans |
| DP-03 | Object storage for student photos and attachments |
| DP-04 | An LLM API, if the Phase 3 AI assistance features are built |

---

## 8. Business Requirements

High-level statements of what the business (here, the teacher) needs. Functional requirements in Section 9 satisfy these.

| ID | Requirement | Priority |
|---|---|---|
| BR-01 | A teacher shall be able to set up their teaching context — schools, years, terms, classes and students — once per academic year | Must |
| BR-02 | A teacher shall be able to plan at three horizons: year (curriculum map), unit (multi-week), and day (session) | Must |
| BR-03 | Planning artefacts shall be linked, so that work done at one horizon populates the others | Must |
| BR-04 | A teacher shall be able to record and review student achievement over time | Must |
| BR-05 | A teacher shall be able to produce parent-facing documents from recorded data without re-entry | Must |
| BR-06 | A teacher shall be able to record daily class administration — attendance, events, meetings, budget | Should |
| BR-07 | The system shall support multi-grade, multi-school and co-taught contexts without duplicate data entry | Must |
| BR-08 | A teacher shall have full control over their data, including export and permanent deletion | Must |
| BR-09 | The system shall be usable on a mobile device for in-classroom tasks | Must |
| BR-10 | The system shall not lose teacher-entered data under normal or degraded network conditions | Must |

---

## 9. Functional Requirements

Priority uses MoSCoW: **M** = Must, **S** = Should, **C** = Could, **W** = Won't (this release).

### 9.1 Accounts & Access (FR-100)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-101 | A user shall register with an email address and password | M | 1 |
| FR-102 | A user shall verify their email address before accessing the application | M | 1 |
| FR-103 | A user shall be able to reset a forgotten password via an emailed, time-limited, single-use link | M | 1 |
| FR-104 | A user shall be able to log in and remain authenticated across sessions on a trusted device | M | 1 |
| FR-105 | A user shall be able to update their display name, email address and password | S | 1 |
| FR-106 | A user shall be able to permanently delete their account, which shall cascade-delete all owned data | M | 1 |
| FR-107 | A user shall be able to export all of their data in a machine-readable format | S | 2 |
| FR-108 | The system shall support optional two-factor authentication via TOTP | C | 3 |
| FR-109 | The system shall enforce feature availability by simulated plan tier, controlled by a feature flag per account | S | 2 |

### 9.2 School, Year & Class Setup (FR-200)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-201 | A user shall create one or more schools, each with a name and optional address | M | 1 |
| FR-202 | A user shall define an academic year with a start and end date | M | 1 |
| FR-203 | A user shall divide an academic year into named terms/periods with date ranges that do not overlap | M | 1 |
| FR-204 | The system shall derive teaching weeks from term date ranges and allow weeks to be marked as non-teaching (holidays, closures) | M | 1 |
| FR-205 | A user shall create classes, each belonging to one school and one academic year | M | 1 |
| FR-206 | A class shall support one or more grade levels, to represent multi-grade classes | M | 1 |
| FR-207 | A user shall select an active school/class context, and all screens shall reflect that context | M | 1 |
| FR-208 | A user shall switch active context in no more than two interactions from any screen | S | 1 |
| FR-209 | A user shall archive a class at year end, retaining its data as read-only | S | 2 |
| FR-210 | A user shall roll forward a class configuration into a new academic year, optionally carrying the student roster | C | 3 |

### 9.3 Students (FR-300)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-301 | A user shall add students to a class with first name, last name and date of birth | M | 1 |
| FR-302 | A user shall bulk-import a student roster from CSV, with a preview and per-row validation before commit | S | 1 |
| FR-303 | A user shall record optional attributes per student: grade level, notes, support needs flag, guardian contact | S | 2 |
| FR-304 | In a multi-grade class, each student shall be assigned to exactly one grade group | M | 1 |
| FR-305 | A user shall mark a student as inactive (left mid-year) without deleting their historical records | M | 2 |
| FR-306 | A user shall upload a photo per student | C | 3 |
| FR-307 | The system shall display a class photo directory in a printable grid layout | C | 3 |
| FR-308 | The system shall display an age distribution chart for the class, computed from dates of birth | C | 3 |
| FR-309 | A user shall create named student groups within a class (ability groups, workshop groups, tables) | S | 2 |
| FR-310 | A student shall be a member of zero or more groups simultaneously | S | 2 |

### 9.4 Weekly Timetable (FR-400)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-401 | A user shall define the teaching days of the week for a class | M | 1 |
| FR-402 | A user shall define the daily time structure: start time, end time, and named breaks | M | 1 |
| FR-403 | A user shall place subject slots onto the weekly grid by specifying day, start time and duration | M | 1 |
| FR-404 | The system shall prevent two slots for the same class from overlapping in time | M | 1 |
| FR-405 | A user shall assign a colour and short label to each subject for visual scanning | S | 1 |
| FR-406 | A user shall duplicate, move and resize slots on the grid | S | 1 |
| FR-407 | A user shall create a slot that applies to only one grade group within a multi-grade class, allowing parallel slots at the same time | M | 2 |
| FR-408 | A user shall define alternating-week timetables (Week A / Week B) | C | 3 |
| FR-409 | A user shall export or print the weekly timetable to PDF | S | 2 |
| FR-410 | A user shall copy a timetable from one class or academic year to another | C | 3 |

### 9.5 Daily Schedule (FR-500)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-501 | The system shall generate a daily schedule for any teaching date from the class timetable | M | 1 |
| FR-502 | A user shall record, per session: a learning objective, a description of activities, and free-text notes | M | 1 |
| FR-503 | A user shall attach materials or links to a session | S | 2 |
| FR-504 | A user shall mark a session as completed, partially completed, or not done | S | 2 |
| FR-505 | A user shall carry an incomplete session forward to a subsequent date | S | 2 |
| FR-506 | A user shall override the timetable for a single date — cancel, add or replace sessions — without altering the recurring timetable | M | 1 |
| FR-507 | A user shall navigate to the previous or next teaching day in one interaction | M | 1 |
| FR-508 | A user shall view and edit the daily schedule on a mobile device | M | 1 |
| FR-509 | A user shall print or export a day's schedule to PDF, in a layout suitable for a substitute teacher | S | 2 |
| FR-510 | A session populated from a lesson plan shall display its objective and standards automatically | M | 2 |

### 9.6 Unit & Lesson Planning (FR-600)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-601 | A user shall create a unit plan with a title, subject, target grade level(s), and a duration in weeks or sessions | M | 2 |
| FR-602 | A unit plan shall contain an ordered sequence of lesson plans | M | 2 |
| FR-603 | A lesson plan shall record: title, objective, duration, activity description, required materials, differentiation notes, and assessment approach | M | 2 |
| FR-604 | A user shall link one or more curriculum standards to a unit and to individual lessons | M | 2 |
| FR-605 | A user shall schedule a unit into the calendar, and the system shall propose dates from the timetable's slots for that subject | M | 2 |
| FR-606 | Scheduling a unit shall populate the corresponding daily schedule sessions with each lesson's objective and description | M | 2 |
| FR-607 | A user shall reorder lessons within a unit, and scheduled dates shall update accordingly | S | 2 |
| FR-608 | A user shall duplicate a unit plan, including for use with a different class or year | S | 2 |
| FR-609 | A user shall maintain a personal library of reusable unit and lesson plans, independent of any class | S | 3 |
| FR-610 | A user shall export a unit plan to PDF | S | 2 |

### 9.7 Curriculum Standards & Mapping (FR-700)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-701 | The system shall ship with a pre-populated standards framework, organised as subject → strand → standard, per grade level | M | 2 |
| FR-702 | A user shall create, edit, reword and deactivate standards without affecting other users | M | 2 |
| FR-703 | A user shall create an entirely custom framework from scratch | S | 2 |
| FR-704 | A user shall build a curriculum map allocating standards to terms and, optionally, to specific weeks | M | 2 |
| FR-705 | The system shall display coverage status per standard: not planned, planned, taught, assessed | M | 2 |
| FR-706 | The system shall flag standards that are unplanned with fewer than a configurable number of weeks remaining in the year | S | 3 |
| FR-707 | A user shall view coverage as a matrix of standards against terms | S | 2 |
| FR-708 | A user shall export the curriculum map to PDF or spreadsheet | S | 2 |
| FR-709 | Coverage status shall update automatically when a linked lesson is marked complete | S | 3 |

### 9.8 Gradebook & Achievement Tracking (FR-800)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-801 | A user shall create an assessment with a title, subject, date, and grading method | M | 1 |
| FR-802 | The system shall support numeric grades with a configurable maximum | M | 1 |
| FR-803 | The system shall support scale-based grades with user-defined levels (for example: not yet / developing / secure / exceeding) | M | 1 |
| FR-804 | The system shall support pass/fail and free-comment-only assessments | S | 2 |
| FR-805 | A user shall enter grades for a whole class in a grid, moving between students with the keyboard | M | 1 |
| FR-806 | A user shall enter or amend a single student's grade from a mobile device | M | 1 |
| FR-807 | A user shall mark a student as absent or exempt for an assessment, excluded from averages | M | 1 |
| FR-808 | A user shall link an assessment to one or more curriculum standards | M | 2 |
| FR-809 | The system shall compute per-student and per-class averages per subject and per term | M | 2 |
| FR-810 | The system shall display a per-student progress view showing results over time | S | 2 |
| FR-811 | A user shall record achievement of a standard per student, independent of any single assessment | S | 2 |
| FR-812 | A user shall weight assessments when computing subject averages | C | 3 |
| FR-813 | A user shall export the gradebook to spreadsheet format | S | 2 |

### 9.9 Report Cards (FR-900)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-901 | A user shall define a report card template specifying which subjects, standards and summary fields appear | M | 2 |
| FR-902 | The system shall populate a report card for a student from gradebook and achievement data for a selected term | M | 2 |
| FR-903 | A user shall write a free-text comment per subject and an overall comment per student | M | 2 |
| FR-904 | A user shall generate report cards for an entire class in a single operation | M | 2 |
| FR-905 | The system shall export report cards as PDF, individually and as a merged batch | M | 2 |
| FR-906 | A user shall preview a report card before generating the batch | S | 2 |
| FR-907 | The system shall retain generated report cards for later retrieval, versioned by generation date | S | 3 |
| FR-908 | A user shall include attendance summary figures on the report card | C | 3 |
| FR-909 | The system shall support a school logo and header on the report card template | C | 3 |

### 9.10 Attendance (FR-1000)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1001 | A user shall record attendance per student per teaching day, with configurable session granularity (daily or per half-day) | M | 3 |
| FR-1002 | The system shall support statuses: present, absent, late, excused absence | M | 3 |
| FR-1003 | A user shall attach a reason note to an absence | S | 3 |
| FR-1004 | A user shall take attendance from a mobile device in under 30 seconds for a class of 30 | M | 3 |
| FR-1005 | The system shall compute attendance rates per student and per class, per term and per year | M | 3 |
| FR-1006 | The system shall highlight students whose attendance falls below a configurable threshold | S | 3 |
| FR-1007 | A user shall export an attendance register for a date range | S | 3 |

### 9.11 Class Administration (FR-1100)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1101 | A user shall create events with a title, date or date range, time, location and notes | S | 3 |
| FR-1102 | Events shall appear on the daily schedule for their date | S | 3 |
| FR-1103 | A user shall record a parent-teacher meeting: student, guardian name, date, time, and outcome notes | S | 3 |
| FR-1104 | The system shall detect and warn on double-booked meeting slots | S | 3 |
| FR-1105 | A user shall generate a printable meeting schedule for a parents' evening | C | 3 |
| FR-1106 | A user shall maintain a class budget with income and expense entries, each with date, description, amount and category | C | 3 |
| FR-1107 | The system shall display a running budget balance and a breakdown by category | C | 3 |
| FR-1108 | A user shall export budget entries to spreadsheet format | C | 3 |

### 9.12 Workshops & Rotations (FR-1200)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1201 | A user shall define a workshop block occupying a timetable slot, containing two or more stations | S | 3 |
| FR-1202 | A station shall record a name, activity description, and supervision type (teacher-led, assistant-led, independent) | S | 3 |
| FR-1203 | A user shall assign student groups to stations | S | 3 |
| FR-1204 | The system shall generate a rotation so that every group visits every station across a configurable number of turns or days | S | 3 |
| FR-1205 | A user shall manually override any group-to-station assignment in a generated rotation | S | 3 |
| FR-1206 | The system shall display the current rotation state on the daily schedule | S | 3 |
| FR-1207 | A user shall print a rotation chart for classroom display | C | 3 |

### 9.13 Collaboration (FR-1300)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1301 | A class owner shall invite another registered user to collaborate on a class by email | S | 3 |
| FR-1302 | The system shall support two collaborator roles: co-teacher (read/write) and viewer (read-only) | S | 3 |
| FR-1303 | A collaborator shall see and edit the shared class's timetable, plans, students and grades according to their role | S | 3 |
| FR-1304 | The system shall record which user created or last modified each planning entry | S | 3 |
| FR-1305 | The class owner shall revoke access at any time | S | 3 |
| FR-1306 | The system shall detect concurrent edits to the same record and prevent silent overwrites | M | 3 |

### 9.14 AI Assistance (FR-1400)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1401 | A user shall request a draft activity description for a lesson, given its objective and linked standards | C | 3 |
| FR-1402 | A user shall request draft differentiation suggestions for a lesson | C | 3 |
| FR-1403 | A user shall request a draft report card comment, given a student's recorded results | C | 3 |
| FR-1404 | All AI-generated text shall be presented as an editable draft that the user must explicitly accept | M | 3 |
| FR-1405 | The system shall not transmit student names or other identifying details to any external AI service | M | 3 |
| FR-1406 | The system shall clearly label content that originated from an AI draft | M | 3 |
| FR-1407 | The system shall apply a per-account usage cap on AI requests | S | 3 |

### 9.15 Mobile Application (FR-1500)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-1501 | The mobile app shall authenticate against the same accounts as the web application | M | 1 |
| FR-1502 | The mobile app shall display today's schedule as its default landing screen | M | 1 |
| FR-1503 | The mobile app shall allow editing of session objectives and notes | M | 1 |
| FR-1504 | The mobile app shall allow attendance capture | M | 3 |
| FR-1505 | The mobile app shall allow single-student and whole-class grade entry | M | 1 |
| FR-1506 | The mobile app shall display the student roster with search | M | 1 |
| FR-1507 | The mobile app shall cache the current week's data for offline read access | S | 2 |
| FR-1508 | The mobile app shall queue offline edits and sync them when connectivity returns | S | 2 |
| FR-1509 | The mobile app shall surface sync conflicts to the user and require an explicit resolution choice | M | 2 |
| FR-1510 | The mobile app shall support biometric unlock where the device provides it | C | 3 |

---

## 10. Non-Functional Requirements

### 10.1 Performance

| ID | Requirement |
|---|---|
| NFR-01 | Any primary screen shall render usable content within 2 seconds on a standard broadband connection |
| NFR-02 | Grade entry keystrokes shall register with no perceptible input lag for a class of 40 students |
| NFR-03 | A batch of 30 report card PDFs shall complete generation within 60 seconds |
| NFR-04 | The mobile app's today screen shall be interactive within 3 seconds of cold launch |

### 10.2 Availability & Reliability

| ID | Requirement |
|---|---|
| NFR-05 | Target availability of 99% monthly, excluding announced maintenance |
| NFR-06 | No teacher-entered data shall be lost on network failure; unsaved edits shall be recoverable |
| NFR-07 | Automated daily backups with a demonstrated restore procedure |
| NFR-08 | All destructive operations shall require explicit confirmation naming the object being deleted |

### 10.3 Security & Privacy

| ID | Requirement |
|---|---|
| NFR-09 | All traffic shall use TLS |
| NFR-10 | Passwords shall be stored using a current password-hashing algorithm with per-user salt |
| NFR-11 | A user shall only be able to access data belonging to their own account or to classes shared with them; this shall be enforced server-side on every request |
| NFR-12 | Student data shall be treated as sensitive: minimum necessary collection, no third-party analytics on screens displaying it |
| NFR-13 | Account deletion shall remove all personal data within a defined retention window |
| NFR-14 | Audit logging of authentication events and of access to shared classes |
| NFR-15 | Student photographs shall be stored in access-controlled storage, never on public URLs |

### 10.4 Usability & Accessibility

| ID | Requirement |
|---|---|
| NFR-16 | The web application shall be responsive from 360px to 1920px viewport width |
| NFR-17 | The interface shall meet WCAG 2.1 Level AA for contrast, focus visibility and keyboard operability |
| NFR-18 | All grid-based entry screens shall be fully operable by keyboard |
| NFR-19 | Colour shall never be the sole carrier of meaning |
| NFR-20 | Printable outputs shall be legible in greyscale |

### 10.5 Compatibility

| ID | Requirement |
|---|---|
| NFR-21 | Support the current and previous major versions of Chrome, Firefox, Safari and Edge |
| NFR-22 | Mobile app to support the current and previous two major OS versions on iOS and Android |

### 10.6 Maintainability & Testability

| ID | Requirement |
|---|---|
| NFR-23 | Every Must-priority functional requirement shall have at least one automated test |
| NFR-24 | API contract shall be documented in an OpenAPI specification kept in sync with the implementation |
| NFR-25 | The system shall support seeding a full synthetic dataset (schools, classes, students, a year of plans and grades) with a single command |
| NFR-26 | Structured application logging with correlation IDs across web, mobile and API |

---

## 11. Data Model — Key Entities

Indicative only; to be refined in technical design.

| Entity | Key attributes | Relationships |
|---|---|---|
| User | email, name, credentials | owns Schools; collaborates on Classes |
| School | name, address | has many Classes |
| AcademicYear | name, start date, end date | has many Terms, Classes |
| Term | name, start date, end date, sequence | belongs to AcademicYear |
| Week | start date, teaching flag | derived from Term |
| Class | name, grade levels, owner | belongs to School and AcademicYear |
| GradeGroup | label, grade level | belongs to Class; has many Students |
| Student | names, date of birth, status, photo | belongs to Class and GradeGroup |
| StudentGroup | name, purpose | many-to-many with Students |
| Subject | name, colour, short label | belongs to User or Class |
| TimetableSlot | day, start time, duration, subject, grade group | belongs to Class |
| ScheduleDay | date, override flag | belongs to Class |
| Session | objective, description, notes, status | belongs to ScheduleDay; optional link to Lesson |
| Unit | title, subject, grade levels, duration | has many Lessons |
| Lesson | title, objective, activities, materials, differentiation, assessment | belongs to Unit |
| Standard | code, description, subject, strand, grade level | many-to-many with Units, Lessons, Assessments |
| CurriculumMapEntry | standard, term, week, status | belongs to Class |
| Assessment | title, subject, date, grading method, max value | belongs to Class |
| Grade | value, comment, exemption flag | belongs to Assessment and Student |
| StandardAchievement | level, date | belongs to Student and Standard |
| ReportCard | term, generated date, document reference | belongs to Student |
| AttendanceRecord | date, session, status, reason | belongs to Student |
| Event | title, dates, location, notes | belongs to Class |
| Meeting | student, guardian, datetime, notes | belongs to Class |
| BudgetEntry | date, description, amount, category | belongs to Class |
| WorkshopBlock | timetable slot, station definitions, rotation plan | belongs to Class |
| Collaboration | user, class, role | join between User and Class |

**Modelling risks to resolve in design:**
- Reconciling a recurring weekly timetable with per-date overrides without duplicating every day of the year.
- Handling mid-year changes to the timetable while preserving historical schedules as they were actually taught.
- Multi-grade parallel sessions in a single time slot.
- Standards frameworks that are shipped as defaults but individually editable per user, without forking the entire dataset.

---

## 12. Reporting & Outputs

| ID | Output | Format | Phase |
|---|---|---|---|
| RPT-01 | Weekly timetable | PDF, print | 2 |
| RPT-02 | Daily schedule / substitute teacher plan | PDF, print | 2 |
| RPT-03 | Unit plan | PDF | 2 |
| RPT-04 | Curriculum map and coverage matrix | PDF, spreadsheet | 2 |
| RPT-05 | Gradebook | Spreadsheet | 2 |
| RPT-06 | Student progress summary | PDF | 2 |
| RPT-07 | Report card (individual and batch) | PDF | 2 |
| RPT-08 | Attendance register and summary | PDF, spreadsheet | 3 |
| RPT-09 | Class photo directory | PDF, print | 3 |
| RPT-10 | Class budget statement | Spreadsheet | 3 |
| RPT-11 | Rotation chart | PDF, print | 3 |
| RPT-12 | Full account data export | JSON or archive | 2 |

---

## 13. Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RSK-01 | Scope inflation — the feature list is large for a single developer | High | High | Strict phasing; Phase 1 must be usable end-to-end before Phase 2 begins |
| RSK-02 | The recurring-schedule-with-overrides model proves harder than estimated | Medium | High | Prototype the temporal model before building UI on top of it |
| RSK-03 | Requirements are inferred rather than validated with real teachers | High | Medium | Flag inferred requirements; seek review from at least one practising teacher |
| RSK-04 | Curriculum standards content is jurisdiction-specific and may be licence-encumbered | Medium | Medium | Ship a small, clearly synthetic default framework; make custom authoring first-class |
| RSK-05 | Offline sync conflict handling becomes a large sub-project | Medium | Medium | Deliver offline read first; defer offline write to Phase 2 with a narrow scope |
| RSK-06 | Handling of real student data if the project is ever shared | Low | High | Keep the reference deployment synthetic-only; document this constraint prominently |
| RSK-07 | Report card PDF layout consumes disproportionate effort | Medium | Medium | Start with one fixed template; make templating configurable only if time allows |
| RSK-08 | Project stalls between phases | Medium | Medium | Each phase ends in a deployable, demonstrable increment |

---

## 14. Release Plan

| Phase | Contents | Exit criteria |
|---|---|---|
| Phase 1 — Core planning | FR-100s, 200s, 300s (core), 400s, 500s, 800s (core), 1500s (core) | A teacher can set up a class, build a timetable, plan and run a week, and record grades, on both web and mobile |
| Phase 2 — Curriculum & reporting | FR-600s, 700s, 900s, remaining 300s and 800s, offline sync | A teacher can plan a unit against standards, see coverage, and produce a class set of report cards |
| Phase 3 — Class administration | FR-1000s, 1100s, 1200s, 1300s, 1400s | Attendance, events, meetings, budget, workshops, collaboration and optional AI drafting are available |

---

## 15. Open Questions

| ID | Question | Owner | Needed by |
|---|---|---|---|
| OQ-01 | Which curriculum framework, if any, can be shipped as the default under an open licence? | Justice | Phase 2 start |
| OQ-02 | Should grading scales be defined per class, per subject, or per assessment? | Justice | Phase 1 design |
| OQ-03 | Is the mobile client cross-platform or native, and does that decision affect the offline strategy? | Justice | Phase 1 start |
| OQ-04 | For multi-grade classes, should the daily schedule show one merged column or one column per grade group? | Justice | Phase 1 design |
| OQ-05 | What is the correct behaviour when a timetable changes mid-year — do past schedules stay frozen? | Justice | Phase 1 design |
| OQ-06 | Should report card comments be versioned, given they may be redrafted several times? | Justice | Phase 2 design |
| OQ-07 | Who resolves a co-teaching conflict when both edit the same session offline? | Justice | Phase 3 design |

---

## 16. Glossary

| Term | Definition |
|---|---|
| Academic year | The full teaching year, divided into terms |
| Term / period | A named division of the academic year with defined start and end dates |
| Timetable slot | A recurring weekly block of time allocated to a subject for a class |
| Session | A single occurrence of a timetable slot on a specific date, carrying an objective and description |
| Unit plan | A multi-lesson sequence of teaching on a topic |
| Curriculum map | An allocation of curriculum standards to terms or weeks across the year |
| Standard | A single stated learning outcome from a curriculum framework |
| Coverage | The extent to which curriculum standards have been planned, taught and assessed |
| Multi-grade class | A single class containing students from two or more grade levels |
| Grade group | A subset of a multi-grade class sharing one grade level |
| Workshop / centre | A stations-based lesson format where groups rotate between activities |
| Rotation | The schedule determining which group is at which station at which time |
| Co-teacher | A second user with read/write access to a shared class |

---

## 17. Requirements Traceability

Each functional requirement should trace forward to design, implementation and test artefacts. Maintain the following matrix alongside development:

| Column | Content |
|---|---|
| Requirement ID | FR-xxx / NFR-xx |
| Business requirement | BR-xx satisfied |
| Phase | 1 / 2 / 3 |
| Design reference | Screen or API endpoint |
| Test case ID(s) | Automated and manual coverage |
| Status | Not started / In progress / Implemented / Verified |

A Must-priority requirement is not considered done until it has a passing automated test recorded in this matrix (see NFR-23).

---

*End of document.*
