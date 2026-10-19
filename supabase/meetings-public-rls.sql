-- RLS for host_meetings: hosts manage their own; authenticated users read all.
-- host_meetings are public schedules — any logged-in devotee can read them.

ALTER TABLE public.host_meetings ENABLE ROW LEVEL SECURITY;

-- Hosts: full CRUD on their own meetings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'host_meetings' AND policyname = 'hosts_own_meetings'
  ) THEN
    CREATE POLICY "hosts_own_meetings"
      ON public.host_meetings FOR ALL
      USING  (host_id = auth.uid())
      WITH CHECK (host_id = auth.uid());
  END IF;
END $$;

-- Authenticated devotees: read all meetings (they are public announcements)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'host_meetings' AND policyname = 'authenticated_read_meetings'
  ) THEN
    CREATE POLICY "authenticated_read_meetings"
      ON public.host_meetings FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;
