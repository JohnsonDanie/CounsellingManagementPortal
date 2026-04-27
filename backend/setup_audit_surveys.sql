-- Phase 1: Immutable Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- e.g., 'VIEW', 'EDIT', 'EXPORT'
    resource_type TEXT NOT NULL, -- e.g., 'clinical_note'
    resource_id UUID, -- Optional, if logging access to a specific record
    details TEXT, -- Any additional info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and make it append-only
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own audit logs" 
    ON public.audit_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own audit logs" 
    ON public.audit_logs FOR SELECT 
    USING (auth.uid() = user_id);

-- Depending on your setup, you may want an admin role to view all logs:
-- CREATE POLICY "Admins can view all logs" ON public.audit_logs FOR SELECT USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- Phase 3: Surveys Table
CREATE TABLE IF NOT EXISTS public.surveys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES public.appointments(id),
    student_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending', -- 'pending' or 'completed'
    rating INTEGER, -- 1 to 5 stars
    followed_plan BOOLEAN, -- true/false
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their surveys" 
    ON public.surveys FOR SELECT 
    USING (auth.uid() = student_id);

CREATE POLICY "Students can update their surveys" 
    ON public.surveys FOR UPDATE 
    USING (auth.uid() = student_id);
    
-- Note: You'll want to run a script or CRON to populate the surveys table 
-- automatically when an appointment is 24 hours past its time.
