🏥 MediConnect
Product Requirements Document
Hospital Appointment Management System — Complete Rebuild

Version 1.0  |  March 2026
Status: Draft for Review


1. Executive Overview
MediConnect is a web-based hospital appointment management platform. The current system (v1) is a single monolithic HTML file with all logic, UI, and data embedded together. This PRD defines requirements for a complete architectural rebuild into a multi-panel, multi-file system with a proper separated database layer and three distinct panels: User, Doctor, and Admin.

The rebuild solves the following critical issues found in the v1 codebase:
•	All data (users, doctors, appointments) is hardcoded in JavaScript arrays — no persistence
•	Single-file architecture makes the system impossible to maintain or scale
•	Appointment slot logic has edge-case bugs (midnight-crossing shifts, no-conflict enforcement)
•	Wallet and payment logic lacks atomic transactions — race conditions possible
•	No real authentication — passwords stored in plain text in client-side JS
•	All three panels (User, Doctor, Admin) share the same DOM and data scope

2. Goals & Success Metrics

Goal	Metric	Target
Separated architecture	Files per panel	Min 3 separate panel files
Database separation	Central DB module	1 shared db.js / db.json
Appointment booking accuracy	Double-booking rate	0%
Wallet safety	Failed transactions	0 balance mismatches
Auth security	Password storage	Hashed, not plaintext
Mobile usability	Responsive on 375px+	100% of core flows

3. Proposed File Architecture

The rebuilt system must follow this multi-file separation. Each panel has its own HTML, CSS, and JS file. A shared database module handles all data read/write operations.

File / Folder	Type	Purpose
index.html	Entry point	Role selection screen → redirects to correct panel
user/user.html	User Panel	Patient-facing booking, profile, wallet UI
user/user.css	Stylesheet	User panel specific styles
user/user.js	Logic	All user panel JavaScript (booking, wallet, display)
doctor/doctor.html	Doctor Panel	Doctor-facing appointment management UI
doctor/doctor.css	Stylesheet	Doctor panel specific styles
doctor/doctor.js	Logic	Doctor panel JS (confirm, complete, delay, no-show)
admin/admin.html	Admin Panel	Admin-facing system management UI
admin/admin.css	Stylesheet	Admin panel specific styles
admin/admin.js	Logic	Admin JS (users, doctors, payments, all appointments)
shared/db.js	Database Layer	Central data store, all CRUD functions — shared by all panels
shared/auth.js	Auth Module	Login, logout, session management, role guard
shared/utils.js	Utilities	timeToMinutes, minutesToTime, notifications, formatCurrency
shared/styles.css	Global CSS	Common variables, resets, shared components (badges, modals)
data/seed.js	Seed Data	Initial doctors, users, sample appointments for development

4. Database Schema (shared/db.js)
All panels must read and write exclusively through the shared/db.js module. No panel should manipulate data arrays directly. The following defines the data structures.

4.1 Users Collection
Field	Type	Description / Constraints
id	Integer	Auto-increment primary key
name	String	Full name — required, min 2 chars
username	String	Unique, lowercase, no spaces
passwordHash	String	Bcrypt hashed — never store plain text
email	String	Valid email format — unique
phone	String	10+ digit phone number
walletBalance	Float	Default 0.00 — must never go negative
createdAt	Timestamp	ISO date string — set on creation
isActive	Boolean	Soft delete flag — default true

4.2 Doctors Collection
Field	Type	Description / Constraints
id	Integer	Auto-increment primary key
name	String	Full name with Dr. prefix
username	String	Unique login credential
passwordHash	String	Bcrypt hashed
specialization	String	E.g. Cardiology, Dermatology
phone	String	Contact number
appointmentFee	Float	Fee in INR — must be > 0
shiftStart	Time String	HH:MM format — 24h
shiftEnd	Time String	HH:MM — can be next day (e.g. 00:00)
lunchStart	Time String	HH:MM — must be within shift
lunchEnd	Time String	HH:MM — must be after lunchStart
isActive	Boolean	Soft delete flag — default true

4.3 Appointments Collection
Field	Type	Description / Constraints
id	Integer	Auto-increment primary key
userId	Integer	Foreign key → Users.id
doctorId	Integer	Foreign key → Doctors.id
date	Date String	YYYY-MM-DD — must be future date
time	Time String	HH:MM — must be within doctor shift, not lunch
duration	Integer	Minutes — default 30, range 1–60
status	Enum	pending | confirmed | rescheduled | completed | noShow
reason	String	Patient-provided reason — required, min 5 chars
notes	String	Doctor notes — optional, set by doctor only
feePaid	Float	Snapshot of fee at time of booking — immutable
createdAt	Timestamp	ISO timestamp of booking creation
updatedAt	Timestamp	ISO timestamp of last status change

4.4 Payment Requests Collection
Field	Type	Description / Constraints
id	Integer	Auto-increment primary key
userId	Integer	Foreign key → Users.id
amount	Float	Requested INR amount — must be > 0
utr	String	Bank UTR / Transaction reference — required for online
status	Enum	pending | approved | rejected
timestamp	Timestamp	ISO timestamp of submission
resolvedAt	Timestamp	ISO timestamp when admin approved/rejected
resolvedBy	Integer	Admin user id who resolved — nullable

5. User Panel (user/user.html)

5.1 Authentication Requirements
•	Login with username + password via shared/auth.js
•	Session must persist across page refresh (localStorage token)
•	Auto-redirect to index.html if not authenticated
•	Sign-up allowed for new users — calls db.createUser()

5.2 Appointment Booking — Bug Fixes Required
The following bugs from v1 must be fixed in the new implementation:

Bug in v1	Root Cause	Fix Required
Slots not blocked for 'pending' appointments	bookedSlots excludes noShow but not other statuses correctly	Block slots for: pending, confirmed, rescheduled
Midnight-crossing shifts (e.g. 16:00–00:00) generate wrong slots	shiftEndMin < shiftStartMin check present but slot loop uses raw minutes	Normalize all times to 24h minute offset; handle wrap-around
Date picker allows today (booking for same day)	Min date set to today+1 but not validated server-side	Enforce future-only at both UI and db layer
Balance deducted even if booking fails mid-way	walletBalance -= fee happens before push to appointments[]	Deduct only after successful appointment creation
No double-booking check across concurrent users	Client-side only validation	db.getAvailableSlots() must be the single source of truth

5.3 Booking Flow (Corrected)
1.	User selects doctor from dropdown (populated from db.getDoctors())
2.	User selects date (min = tomorrow, no weekends blocked unless doctor off)
3.	System calls db.getAvailableSlots(doctorId, date) — returns array of HH:MM strings
4.	User selects time slot and enters reason (min 5 chars)
5.	System checks: user wallet >= doctor.appointmentFee
6.	System calls db.createAppointment() — atomic: slot check + fee deduct + record insert
7.	On success: display confirmation with appointment ID and queue position
8.	On failure: show specific error — insufficient funds / slot taken / invalid date

5.4 My Appointments Display
•	Show all appointments for logged-in user, sorted by date/time ascending
•	Show: Doctor Name, Specialization, Date, Time, Fee Paid (snapshot), Status badge, Queue position
•	Queue position: count of non-completed/non-noShow appointments before this one for same doctor+date
•	Status badge colours: pending=yellow, confirmed=green, rescheduled=orange, completed=blue, noShow=red
•	No cancel/delete option for users — only doctors/admins can modify

5.5 Wallet
•	Display current balance prominently
•	Add Money form: amount + UTR field — submits to db.createPaymentRequest()
•	Show pending request status: 'Awaiting admin approval'
•	Balance updates in real-time when admin approves

6. Doctor Panel (doctor/doctor.html)

6.1 Authentication
•	Login only via doctor credentials — role-guarded by shared/auth.js
•	Cannot access user or admin panels

6.2 Dashboard Stats
•	Total appointments (all time)
•	Pending (awaiting confirmation)
•	Upcoming (confirmed + rescheduled)
•	Completed (today and all time tabs)

6.3 Appointment Management Actions

Action	Allowed Status	Behavior
Confirm	pending only	Changes status to 'confirmed'. Notifies patient (in-app).
Complete	confirmed, rescheduled	Changes to 'completed'. Triggers queue adjustment for remaining.
No Show	confirmed, rescheduled	Status → noShow. Refunds fee to user wallet. Shifts queue up.
Delayed	confirmed, rescheduled	Swaps appointment time with next patient. Both become 'rescheduled'.
Modify	any except completed/noShow	Opens modal: change date, time, duration, notes. Status → rescheduled.

6.4 Queue Adjustment Logic (adjustFollowingAppointments) — Bug Fix
The v1 function adjustFollowingAppointments has a critical bug: when a noShow occurs, it uses the noShow appointment's start time as 'next available' correctly, but when duration is changed, it does not account for gaps that may already exist. The rebuild must:
•	After any status change (complete/noShow) or duration change: recalculate all subsequent appointment times for that doctor+date
•	Respect lunch break — no appointment should be slid into lunch window during adjustment
•	Respect shift end — appointments that cannot fit within shift must be flagged, not silently moved
•	All adjusted appointments get status 'rescheduled' (except pending ones which remain pending)

6.5 Modify Appointment Modal
•	Date field: can be changed to any future date
•	Time field: must revalidate against db.getAvailableSlots() for the new date — not just display old time
•	Duration: 1–60 minutes — triggers queue cascade on save
•	Notes: free text — visible to admin but should also be visible to patient in their view

7. Admin Panel (admin/admin.html)

7.1 Authentication
•	Single admin account — credentials from config, not database
•	Admin session isolated from user/doctor sessions

7.2 Dashboard Stats
•	Total users, total doctors, total appointments, pending payment requests
•	Stats must refresh after every admin action

7.3 User Management
•	View all users in searchable table (search by name or username)
•	Add user form with: name, email, phone, username, password, initial wallet balance
•	Delete user: soft delete (isActive=false) — confirm dialog required — associated appointments also soft-deleted
•	Wallet manual adjustment: positive or negative amount with reason note

7.4 Doctor Management
•	View all doctors in searchable table
•	Add doctor form with all fields (name, username, password, specialization, phone, fee, shift times, lunch times)
•	Validation: shiftEnd can be 00:00 (midnight-crossing); lunchStart must be within shift
•	Delete doctor: soft delete — confirm dialog — associated appointments soft-deleted

7.5 Payment Request Management
•	List all pending requests sorted by submission time (oldest first)
•	Each row shows: User name, amount, UTR/Transaction ID, submission timestamp
•	Approve: atomically adds amount to user.walletBalance and marks request as approved
•	Reject: marks as rejected, no wallet change, reason field optional
•	Admin cannot approve already-processed requests

7.6 All Appointments View
•	Sortable table: all appointments across all users and doctors
•	Filter by: status, doctor, date range
•	Admin can Modify (modal) or Delete any appointment
•	Delete has NO refund — admin must confirm with explicit warning
•	Delayed action available for confirmed/rescheduled appointments (same logic as doctor panel)

8. Shared Module Specifications

8.1 shared/db.js — API Surface
All panels import from shared/db.js. No panel accesses raw data arrays. The module exposes:

Function	Description
db.getUsers()	Returns all active users (isActive=true)
db.getUserById(id)	Returns single user or null
db.createUser(data)	Validates uniqueness, hashes password, inserts
db.updateUserWallet(id, delta)	Atomic wallet change — throws if result < 0
db.deleteUser(id)	Soft delete — sets isActive=false
db.getDoctors()	Returns all active doctors
db.getDoctorById(id)	Returns single doctor or null
db.createDoctor(data)	Validates shift/lunch logic, inserts
db.getAvailableSlots(doctorId, date)	Returns array of available HH:MM strings — canonical slot check
db.getAppointments(filters)	Flexible filter: {userId, doctorId, date, status}
db.createAppointment(data)	Atomic: slot check + fee deduct + insert
db.updateAppointment(id, changes)	Updates status, time, duration, notes, updatedAt
db.deleteAppointment(id)	Hard delete — removes from array
db.adjustQueue(doctorId, date, fromTime)	Cascade queue recalculation — used after noShow/complete/modify
db.getPaymentRequests(status)	Filter by status: pending|approved|rejected|all
db.createPaymentRequest(data)	Inserts new request with status=pending
db.resolvePaymentRequest(id, action)	Atomic: update request + wallet if approved

8.2 shared/auth.js
•	login(username, password, role): validates credentials, stores session token in localStorage
•	logout(): clears session, redirects to index.html
•	getCurrentUser(): returns current user object from session
•	requireRole(role): if current role doesn't match, redirect to index.html
•	isAuthenticated(): returns true/false

8.3 shared/utils.js
•	timeToMinutes(HH:MM) → Integer
•	minutesToTime(Integer) → HH:MM — handles overflow past midnight
•	addMinutesToTime(HH:MM, minutes) → HH:MM
•	formatCurrency(amount) → '₹ 1,500.00'
•	showNotification(message, type) → renders toast notification — success | warning | error | info
•	setMinDateToTomorrow(inputElement) → sets min attribute
•	getQueuePosition(appointmentId) → Integer or 'N/A'

9. Known Bugs in v1 — Complete List

#	Bug Description	Location in v1	Fix
1	Wallet deducted before appointment insert — partial failure possible	bookAppointment()	Use db.createAppointment() atomic transaction
2	Midnight-crossing shifts generate incorrect slot times	generateTimeSlots()	Normalize to absolute minute offsets; modulo on display
3	adjustFollowingAppointments() doesn't skip lunch during cascade	adjustFollowingAppointments()	Check lunch window during each slot assignment in cascade
4	Passwords stored and compared as plain text in JS	performLogin()	Use bcrypt.js for hashing and comparison
5	Admin wallet adjustment doesn't validate negative resulting balance	handleManualAdjustment()	db.updateUserWallet() must throw if balance < 0
6	Deleted user's appointments remain in appointments[]	deleteUser()	Cascade delete or soft-delete linked appointments
7	Doctor 'Modify' modal time field is read-only — can't change time	openModal()	Make time a dropdown using getAvailableSlots() for new date
8	Queue position counts 'pending' appointments differently per view	getQueuePosition()	Standardize: count pending+confirmed+rescheduled in time order
9	refreshAllViews() calls initAdminPage() which resets all search fields	refreshAllViews()	Only refresh affected data sections, preserve filter state
10	No validation that lunchStart is within doctor shift hours	addDoctor() form	db.createDoctor() must validate: shiftStart < lunchStart < lunchEnd < shiftEnd

10. Non-Functional Requirements

10.1 Performance
•	Initial page load: < 2 seconds on 3G connection
•	Slot generation for any doctor+date: < 100ms
•	All CRUD operations: < 200ms (local storage simulation)

10.2 Security
•	No plain-text passwords anywhere in source code or localStorage
•	Role-based access enforced on every panel load via shared/auth.js
•	Admin credentials must not be stored in client-accessible JS
•	UTR numbers must not be re-usable (check for duplicates in db.createPaymentRequest)

10.3 Responsiveness
•	All three panels must be fully usable on mobile (375px+)
•	Tables collapse to card layout on mobile (data-label attributes required)
•	Modal dialogs must not overflow on small screens

10.4 Accessibility
•	All form inputs must have associated <label> elements
•	Buttons must have descriptive aria-label when icon-only
•	Color is never the only indicator of status — status text must accompany color badges

11. Out of Scope (v1 Rebuild)
•	Backend server / REST API — frontend-only with localStorage/IndexedDB
•	Email or SMS notifications
•	Doctor availability calendar (weekly off-day configuration)
•	Multi-clinic support
•	Insurance / billing integration
•	Patient medical records

12. Appendix — Appointment Status State Machine

The following defines all valid status transitions. Any transition not listed is forbidden.

From Status	To Status	Triggered By
(new)	pending	User books appointment
pending	confirmed	Doctor confirms
pending	rescheduled	Doctor/Admin modifies
confirmed	completed	Doctor marks complete
confirmed	noShow	Doctor marks no-show
confirmed	rescheduled	Doctor/Admin modifies or Delayed action
rescheduled	completed	Doctor marks complete
rescheduled	noShow	Doctor marks no-show
rescheduled	rescheduled	Delayed swap or further modification
completed	(terminal)	No further transitions allowed
noShow	(terminal)	No further transitions allowed


End of Document — MediConnect PRD v1.0
