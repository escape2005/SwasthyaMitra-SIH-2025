-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.appointment_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  patient_id uuid,
  doctor_id uuid,
  patient_name text NOT NULL,
  requested_time text NOT NULL,
  appointment_type text DEFAULT 'in-person'::text CHECK (appointment_type = ANY (ARRAY['video'::text, 'in-person'::text])),
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])),
  symptoms text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  consultation_fee numeric DEFAULT 0,
  notes text DEFAULT ''::text,
  CONSTRAINT appointment_requests_pkey PRIMARY KEY (id),
  CONSTRAINT appointment_requests_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id),
  CONSTRAINT appointment_requests_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id)
);
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  doctor_id uuid,
  appointment_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text])),
  symptoms text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])),
  type text DEFAULT 'Consultation'::text,
  appointment_type text DEFAULT 'in-person'::text CHECK (appointment_type = ANY (ARRAY['video'::text, 'in-person'::text])),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id),
  CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id)
);
CREATE TABLE public.chatbot_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  message text NOT NULL,
  response text,
  message_type text NOT NULL DEFAULT 'text'::text CHECK (message_type = ANY (ARRAY['text'::text, 'voice'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chatbot_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chatbot_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.doctors (
  id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  specialty text,
  hospital text,
  rating numeric,
  registration_no text,
  council_name text,
  year_of_registration text,
  is_verified boolean DEFAULT false,
  CONSTRAINT doctors_pkey PRIMARY KEY (id),
  CONSTRAINT doctors_id_fkey FOREIGN KEY (id) REFERENCES public.users(id)
);
CREATE TABLE public.health_readings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['blood_pressure'::text, 'blood_glucose'::text, 'other'::text])),
  systolic numeric,
  diastolic numeric,
  glucose numeric,
  unit text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  meal_timing text CHECK (meal_timing = ANY (ARRAY['before_meal'::text, 'after_meal'::text])),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT health_readings_pkey PRIMARY KEY (id),
  CONSTRAINT health_readings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id)
);
CREATE TABLE public.patients (
  id uuid NOT NULL,
  emergency_contacts jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  blood_grp character varying CHECK (blood_grp::text = ANY (ARRAY['A+'::character varying, 'A-'::character varying, 'B+'::character varying, 'B-'::character varying, 'AB+'::character varying, 'AB-'::character varying, 'O+'::character varying, 'O-'::character varying]::text[])),
  dob date CHECK (dob <= CURRENT_DATE AND dob >= '1900-01-01'::date),
  gender character varying CHECK (gender::text = ANY (ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying, 'prefer_not_to_say'::character varying]::text[])),
  height_cm numeric,
  weight_kg numeric,
  allergies ARRAY,
  chronic_conditions ARRAY,
  primary_physician character varying,
  profile_completed boolean DEFAULT false,
  medical_history_completed boolean DEFAULT false,
  CONSTRAINT patients_pkey PRIMARY KEY (id),
  CONSTRAINT patients_id_fkey FOREIGN KEY (id) REFERENCES public.users(id)
);
CREATE TABLE public.prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  doctor_id uuid,
  appointment_id uuid,
  medicines jsonb NOT NULL,
  instructions text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  taken_on ARRAY,
  CONSTRAINT prescriptions_pkey PRIMARY KEY (id),
  CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id),
  CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id),
  CONSTRAINT prescriptions_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);
CREATE TABLE public.sos_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  latitude double precision,
  longitude double precision,
  alert_time timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'notified'::text, 'resolved'::text])),
  CONSTRAINT sos_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT sos_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'not set'::text CHECK (role = ANY (ARRAY['doctor'::text, 'patient'::text])),
  name text NOT NULL,
  avatar text,
  phone text,
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);