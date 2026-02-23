
-- Fix views: set security_invoker = true so RLS of the querying user applies
alter view public.v_my_leads_export set (security_invoker = true);
alter view public.v_admin_leads_export set (security_invoker = true);
alter view public.v_commission_payout_report set (security_invoker = true);

-- Fix function search_path for set_updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end $$;
