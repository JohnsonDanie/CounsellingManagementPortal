# Nile University Clinical Management Portal

A modern, high-fidelity counseling management portal designed for school wellness departments. Optimized for high-risk triage, session documentation, and patient follow-up.

## 📁 Repository Structure

```text
Team-B-Hackathon-Project-2026/
├── frontend/           # React + Vite Frontend
├── backend/            # Supabase Backend / Edge Functions
├── reference/          # Design documentation & legacy UI
├── .gitignore          # Project-wide ignore rules
└── README.md           # You are here
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Project URL & Anon Key
- Google AI Studio API Key (for Gemini SOAP functionality)

### Installation

1. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Running Locally**
   ```bash
   npm run dev
   ```

## ✨ Key Features

- **Crisis Flagging Engine**: Automated keyword-based triage for student assessments.
- **AI SOAP Generator**: Powered by Gemini 1.5 Flash for instant clinical documentation.
- **Walk-in Digital Queue**: Dynamic priority waiting list for high-risk students.
- **Counselor Dashboard**: Integrated management of appointments, emergencies, and referrals.
- **Student Portal**: Self-service booking and wellness assessment flow.

## 📖 Documentation

For detailed guides on the specialized components in this repository:
- [Intelligent Booking System: Technical Guide](docs/booking_system_technical_guide.md)
- [Intelligent Booking System: User Manual](docs/booking_system_user_manual.md)

## 🛡️ Security
- Role-based Access Control (RBAC)
- Integrated Crisis Response protocols
- Row-Level Security (RLS) via Supabase

## 🛡️ Scheduling Engine & Clinical Safety

The portal implements a specialized scheduling engine designed for high-density clinical environments.

### 1. Mandatory Constraints
- **Minimum Duration**: 90 Minutes (enforced for all manual and auto-bookings).
- **Buffer Period**: 2 Minutes (mandatory administrative reset time between sessions).
- **Clinical Break**: Hard-blocked 12:00 PM - 1:00 PM for lunch/wellness.

### 2. Emergency Auto-Allocation
Students flagged with **Urgent** or **Emergency** priority are automatically allocated to the earliest available slot by the system. Counselors cannot manually reschedule these high-priority sessions to ensure clinical safety compliance.

### 3. Greedy Optimization
When manually scheduling **Routine** students, the system highlights **Optimal Slots** (those adjacent to existing sessions). This "Greedy" strategy maximizes counselor utilization by preventing 30-60 minute "dead zones" in the diary.

### 4. Counselor Privilege
Counselors can read a student's assessment story and manually up-size a session (90m → 120m → 180m) using the duration selector in the **Routine Referrals** sidebar before booking.

---
© 2026 Nile University • Clinical Management Portal
