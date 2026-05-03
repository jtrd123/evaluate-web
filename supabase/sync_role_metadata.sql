-- ============================================================
-- 1. Trigger: auto-sync role → JWT user_metadata on profile changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_role_to_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_role_on_profile_change ON public.profiles;
CREATE TRIGGER sync_role_on_profile_change
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_role_to_user_metadata();

-- ============================================================
-- 2. Backfill: sync role for users that already exist
-- ============================================================
UPDATE auth.users u
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE u.id = p.id;
