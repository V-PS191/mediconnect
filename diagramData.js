/**
 * diagramData.js
 * MediConnect System Design — Tree Data
 * 
 * Hierarchy Order: User → Doctor → Admin → Super Admin → Shared Services
 * 
 * Each node has:
 *   name      – Display label
 *   type      – Color category: root | user | admin | doctor | shared | decision | superadmin
 *   details   – Tooltip description
 *   children  – Sub-nodes
 */

const systemKeyNotes = [
    "Four-panel architecture: User, Doctor, Admin, Super Admin — each isolated with dedicated UI.",
    "Super Admin manages all hospital branches — each branch has its own Admin.",
    "Central shared/db.js enforces a single source of truth for all CRUD operations.",
    "Atomic booking: slot validation + wallet deduction happen in one transaction.",
    "Role-based auth via shared/auth.js guards every panel from unauthorized access.",
    "Midnight-crossing shifts handled with normalised minute offsets (no raw HH:MM bugs).",
    "Queue cascade: completing or no-showing auto-adjusts all downstream appointments.",
    "Wallet safety: balance can never go negative — enforced at db layer.",
    "Payment requests require Admin UTR verification before wallet credit.",
    "Multi-branch hospital support: Super Admin oversees all branches centrally."
];

const diagramData = {
    name: "MediConnect",
    type: "root",
    details: "Hospital Appointment Management System — four distinct panels sharing a central data layer with multi-branch support.",
    children: [
        {
            name: "User Panel",
            type: "user",
            details: "Patient-facing interface for booking appointments, managing wallet, and tracking queue.",
            children: [
                {
                    name: "Authentication",
                    type: "user",
                    details: "Login / Sign-up via shared/auth.js. Session persists in localStorage.",
                    children: [
                        { 
                            name: "Login", 
                            type: "user", 
                            details: "Username + password credential check.",
                            children: [
                                { name: "Username", type: "user", details: "Required for authentication." },
                                { name: "Password", type: "user", details: "Required for authentication." }
                            ]
                        },
                        { 
                            name: "Register", 
                            type: "user", 
                            details: "New user creation with db.createUser().",
                            children: [
                                { name: "Name", type: "user", details: "User's full name." },
                                { name: "Email", type: "user", details: "User's email address." },
                                { name: "Phone Number", type: "user", details: "User's contact number." },
                                { name: "Address", type: "user", details: "User's residential address." },
                                { name: "Username", type: "user", details: "Chosen unique username." },
                                { name: "Password", type: "user", details: "Chosen secure password." }
                            ]
                        }
                    ]
                },
                {
                    name: "Book Appointment",
                    type: "user",
                    details: "Core booking flow — select doctor → date → time slot → confirm.",
                    children: [
                        { name: "Select Doctor", type: "user", details: "Dropdown populated from db.getDoctors()." },
                        { name: "Pick Date", type: "user", details: "Future dates only. Min = tomorrow." },
                        { name: "Choose Slot", type: "decision", details: "db.getAvailableSlots(doctorId, date) — the single source of truth." },
                        {
                            name: "Wallet Check",
                            type: "decision",
                            details: "Is user.walletBalance >= doctor.appointmentFee?",
                            children: [
                                { name: "Insufficient → Add Money", type: "user", details: "Submit amount + UTR → awaits Admin approval." },
                                {
                                    name: "Sufficient → Confirm",
                                    type: "user",
                                    details: "Atomic: slot lock + fee deduct + appointment insert.",
                                    children: [
                                        { name: "Booking Created", type: "user", details: "Shows appointment ID and queue position." }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "My Appointments",
                    type: "user",
                    details: "View all bookings: Doctor, Date, Time, Fee, Status badge, Queue position."
                },
                {
                    name: "Wallet",
                    type: "user",
                    details: "View balance. Submit Add Money requests with UTR. Track pending approvals."
                }
            ]
        },
        {
            name: "Doctor Panel",
            type: "doctor",
            details: "Doctor-facing interface for managing daily patient queue and appointments.",
            children: [
                { name: "Dashboard Stats", type: "doctor", details: "Total, Pending, Upcoming, Completed counts." },
                {
                    name: "Queue Management",
                    type: "doctor",
                    details: "Action buttons per appointment to drive status transitions.",
                    children: [
                        { name: "Confirm", type: "doctor", details: "pending → confirmed. Notifies patient." },
                        {
                            name: "Modify / Delay",
                            type: "doctor",
                            details: "Change date, time, duration, notes. Status → rescheduled.",
                            children: [
                                { name: "Cascade Queue Adjust", type: "decision", details: "Recalculates all downstream slots respecting lunch & shift end." }
                            ]
                        },
                        { name: "Complete", type: "doctor", details: "confirmed/rescheduled → completed. Triggers queue shift." },
                        { name: "No-Show", type: "doctor", details: "→ noShow. Refund fee to wallet. Queue shifts up." }
                    ]
                }
            ]
        },
        {
            name: "Admin Panel",
            type: "admin",
            details: "Branch-level system control: users, doctors, payments, and all appointments for one hospital branch.",
            children: [
                { name: "Dashboard", type: "admin", details: "Branch-level stats: total users, doctors, appointments, pending payments." },
                {
                    name: "User Management",
                    type: "admin",
                    details: "Search, Add, Soft-Delete users. Manual wallet adjustments.",
                    children: [
                        { name: "Add User", type: "admin", details: "Name, email, phone, username, password, initial balance." },
                        { name: "Delete User", type: "decision", details: "Soft delete. Cascades to linked appointments." },
                        { name: "Wallet Adjust", type: "admin", details: "Positive or negative delta with reason note." }
                    ]
                },
                {
                    name: "Doctor Management",
                    type: "admin",
                    details: "Add/remove doctors for this branch. Configure shifts, lunch, fees, specializations.",
                    children: [
                        { name: "Add Doctor", type: "admin", details: "All fields including shift & lunch validation." },
                        { name: "Delete Doctor", type: "decision", details: "Soft delete. Associated appointments deactivated." }
                    ]
                },
                {
                    name: "Payment Approvals",
                    type: "admin",
                    details: "Review pending Add Money requests. Verify UTR. Approve or Reject.",
                    children: [
                        { name: "Approve", type: "admin", details: "Atomic: credit amount to user wallet." },
                        { name: "Reject", type: "admin", details: "Mark invalid. No wallet change." }
                    ]
                },
                { name: "All Appointments", type: "admin", details: "Branch-level view. Filter by status, doctor, date. Modify/Delete any." }
            ]
        },
        {
            name: "Super Admin Panel",
            type: "superadmin",
            details: "Top-level control over the entire hospital network. Manages all branches, admins, doctors, and users across the system.",
            children: [
                {
                    name: "Global Dashboard",
                    type: "superadmin",
                    details: "Cross-branch analytics: total branches, admins, doctors, users, appointments, revenue."
                },
                {
                    name: "Branch Management",
                    type: "superadmin",
                    details: "Create, edit, or deactivate hospital branches. Each branch gets one Admin.",
                    children: [
                        { name: "Add Branch", type: "superadmin", details: "Branch name, location, contact info. Auto-creates branch record." },
                        { name: "Edit Branch", type: "superadmin", details: "Update branch details, reassign Admin." },
                        { name: "Deactivate Branch", type: "decision", details: "Soft-deletes branch + cascades to all linked admins, doctors, users, appointments." }
                    ]
                },
                {
                    name: "Admin Management",
                    type: "superadmin",
                    details: "Assign, reassign, or remove Admins for each branch.",
                    children: [
                        { name: "Add Admin", type: "superadmin", details: "Create admin account and assign to a hospital branch." },
                        { name: "Reassign Admin", type: "superadmin", details: "Move admin from one branch to another." },
                        { name: "Remove Admin", type: "decision", details: "Deactivate admin credentials. Branch needs new admin assignment." }
                    ]
                },
                {
                    name: "Global Doctor Oversight",
                    type: "superadmin",
                    details: "View and manage all doctors across all branches.",
                    children: [
                        { name: "View All Doctors", type: "superadmin", details: "Cross-branch searchable table of every doctor." },
                        { name: "Transfer Doctor", type: "superadmin", details: "Move doctor from one branch to another." }
                    ]
                },
                {
                    name: "Global User Oversight",
                    type: "superadmin",
                    details: "View and manage all patients across all branches.",
                    children: [
                        { name: "View All Users", type: "superadmin", details: "Cross-branch searchable table of every user." },
                        { name: "Global Wallet Adjust", type: "superadmin", details: "Override wallet balance for any user across any branch." }
                    ]
                },
                {
                    name: "Global Appointments",
                    type: "superadmin",
                    details: "View all appointments across every branch. Filter by branch, doctor, status, date range."
                },
                {
                    name: "Reports & Analytics",
                    type: "superadmin",
                    details: "Revenue reports, branch performance, peak hours analysis, doctor utilisation rates.",
                    children: [
                        { name: "Revenue by Branch", type: "superadmin", details: "Total fees collected per branch over time." },
                        { name: "Doctor Utilisation", type: "superadmin", details: "Appointment fill rates and no-show percentages per doctor." },
                        { name: "Peak Hours", type: "superadmin", details: "Heatmap of busiest booking times across all branches." }
                    ]
                }
            ]
        },
        {
            name: "Shared Services",
            type: "shared",
            details: "Central logic layer — imported by all four panels. No direct data manipulation outside this layer.",
            children: [
                {
                    name: "db.js",
                    type: "shared",
                    details: "Data store: Branches, Users, Doctors, Appointments, Payments. All CRUD + atomic transactions.",
                    children: [
                        { name: "getAvailableSlots()", type: "shared", details: "Canonical slot check — blocks pending, confirmed, rescheduled." },
                        { name: "createAppointment()", type: "shared", details: "Atomic: validate slot + deduct fee + insert record." },
                        { name: "adjustQueue()", type: "shared", details: "Cascade recalculation after noShow / complete / modify." },
                        { name: "resolvePayment()", type: "shared", details: "Atomic: approve request + credit wallet." },
                        { name: "manageBranch()", type: "shared", details: "CRUD for hospital branches — Super Admin only." }
                    ]
                },
                {
                    name: "auth.js",
                    type: "shared",
                    details: "Login, logout, session tokens, role-based guards (user, doctor, admin, superadmin)."
                },
                {
                    name: "utils.js",
                    type: "shared",
                    details: "timeToMinutes(), minutesToTime(), formatCurrency(), showNotification()."
                }
            ]
        }
    ]
};
