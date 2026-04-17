# Technical Guide: Intelligent Slot-Based Booking System

This document provides a deep-dive into the technical architecture and logic of the Clinical Management Portal's scheduling system.

## 1. The Core Algorithm: Slot-Based Filtering

Unlike traditional interval searches that perform complex arithmetic on arbitrary time ranges, this system uses **Discretized Slot Matching**.

### How it works:
1.  **Discretization**: The working day is divided into discrete 30-minute blocks (e.g., 09:00, 09:30, 10:00).
2.  **Constraint Propagation**: For a given duration $D$ (e.g., 60 mins) and a requested start time $T$:
    -   The system checks if the counselor is available for the *entire* window $[T, T + D]$.
    -   **Critical**: It also enforces a mandatory **30-minute safety buffer** after the session. Thus, the actual "blocked" window checked is $[T, T + D + 30]$.
3.  **Conflict Detection**: The system queries existing appointments and excludes any slot where the session window overlaps with an already booked window.

## 2. Logic Implementation (`bookingService.js`)

The logic is encapsulated in `frontend/src/lib/bookingService.js`.

### Key Function: `getAvailableSlots(counselorId, date, duration)`
1.  **Template Fetching**: Retrieves the counselor's defined working hours from `counselor_availability`.
2.  **Appointment Fetching**: Retrieves all existing appointments for that counselor on the selected date.
3.  **Slot Generation**:
    -   Starts at the counselor's `start_time`.
    -   Iterates in 30-minute steps until `end_time`.
    -   For each step, it validates if `step + duration + buffer` fits within the day and doesn't overlap with existing bookings.

## 3. Database Schema

### Table: `public.counselor_availability`
This table stores the weekly availability template for each counselor.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `counselor_id` | `UUID` | Links to `profiles.id` |
| `day_of_week` | `INT` | 0 (Sun) to 6 (Sat) |
| `start_time` | `TIME` | When the counselor starts work (e.g., '09:00:00') |
| `end_time` | `TIME` | When the counselor stops work (e.g., '17:00:00') |

### Table: `public.appointments` (Relevant Columns)
| Column | Type | Description |
| :--- | :--- | :--- |
| `appointment_time` | `TIMESTAMPTZ` | The exact start time of the session. |
| `duration_minutes` | `INT` | Length of the session (e.g., 30, 60, 90, 120). |
| `buffer_minutes` | `INT` | Reserved gap after the session (default 30). |

## 4. Conflict Resolution Formula

A time slot $T_s$ of duration $D_s$ is available if for every existing appointment $(T_b, D_{total\_b})$:
$$ (T_s + D_s + Buffer) \le T_b \quad \text{OR} \quad T_s \ge (T_b + D_{total\_b}) $$
*Where $D_{total\_b} = Duration_b + Buffer_b$.*

## 5. UI Enforcements
- **Max Duration**: Limited to 120 minutes in `BookingModal.jsx`.
- **Buffer Display**: Slots blocked by buffers are greyed out or completely hidden from the student to prevent selection errors.

---
> [!NOTE]
> All times should ideally be handled as ISO strings or consistent UTC offsets to avoid timezone drift between the client and the Supabase Postgres instance.
