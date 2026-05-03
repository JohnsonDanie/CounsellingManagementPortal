import { supabase } from './supabase';

/**
 * Service to handle Counselor Booking logic.
 * Implements slot-based filtering with a 30-minute safety buffer.
 */

// Global constant for session limits
export const MAX_SESSION_DURATION = 120; // 2 hours
export const DEFAULT_BUFFER = 30; // 30 minutes

/**
 * Fetches available time slots for a specific counselor on a given date.
 * 
 * @param {string} counselorId - UUID of the counselor
 * @param {string} date - ISO Date string (YYYY-MM-DD)
 * @param {number} durationMinutes - Requested session length
 * @returns {Promise<Array>} List of available starting slots
 */
export const getAvailableSlots = async (counselorId, date, durationMinutes = 60) => {
  if (durationMinutes > MAX_SESSION_DURATION) {
    throw new Error(`Sessions cannot exceed ${MAX_SESSION_DURATION} minutes.`);
  }

  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate.getDay();
  
  // 1. Fetch counselor's base working hours for this day of the week
  const { data: availability, error: availError } = await supabase
    .from('counselor_availability')
    .select('*')
    .eq('counselor_id', counselorId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .maybeSingle();

  let defaultAvailability = availability;
  if (availError || !availability) {
    // Demo Fallback: If counselor hasn't set hours yet, assume 9 AM to 5 PM
    defaultAvailability = { start_time: '09:00', end_time: '17:00' };
  }

  // 2. Fetch all existing, non-cancelled appointments for this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: appointments, error: apptError } = await supabase
    .from('appointments')
    .select('appointment_time, duration_minutes, buffer_minutes')
    .eq('counselor_id', counselorId)
    .gte('appointment_time', startOfDay.toISOString())
    .lte('appointment_time', endOfDay.toISOString())
    .neq('status', 'cancelled');

  if (apptError) {
    console.error('Error fetching appointments:', apptError);
    return [];
  }

  // 3. Algorithm: Slot Generation & Filtering
  const slots = [];
  const [startH, startM] = defaultAvailability.start_time.split(':');
  const [endH, endM] = defaultAvailability.end_time.split(':');
  
  let currentPointer = new Date(date);
  currentPointer.setHours(parseInt(startH), parseInt(startM), 0, 0);

  const dayEndTime = new Date(date);
  dayEndTime.setHours(parseInt(endH), parseInt(endM), 0, 0);

  // We iterate in 30-minute "check-points"
  while (currentPointer < dayEndTime) {
    const requestedStart = new Date(currentPointer.getTime());
    const requestedEnd = new Date(requestedStart.getTime() + (durationMinutes + DEFAULT_BUFFER) * 60000);

    // Rule: The requested session + buffer cannot exceed the working day end time
    if (requestedEnd > dayEndTime) break;

    // Check for overlaps with EVERY existing appointment (including their buffers)
    const hasConflict = appointments.some(appt => {
      const apptStart = new Date(appt.appointment_time);
      const apptEnd = new Date(apptStart.getTime() + (appt.duration_minutes + appt.buffer_minutes) * 60000);
      
      // Overlap formula: (StartA < EndB) and (EndA > StartB)
      return (requestedStart < apptEnd) && (requestedEnd > apptStart);
    });

    if (!hasConflict) {
      slots.push({
        time: requestedStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        iso: requestedStart.toISOString(),
        duration: durationMinutes
      });
    }

    // Advance by 30 minutes for the next potential starting slot
    currentPointer = new Date(currentPointer.getTime() + 30 * 60000);
  }

  return slots;
};

/**
 * Saves a new counselor availability record.
 */
export const updateCounselorAvailability = async (counselorId, dayOfWeek, startTime, endTime, isActive = true) => {
  const { data, error } = await supabase
    .from('counselor_availability')
    .upsert({
      counselor_id: counselorId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      is_active: isActive
    }, { onConflict: 'counselor_id, day_of_week' });

  if (error) throw error;
  return data;
};
