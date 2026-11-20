-- La función del trigger solo debe ejecutarla Postgres al crear usuarios en Supabase Auth.
-- Corrige el aviso del Security Advisor de Supabase (SECURITY DEFINER expuesta vía /rest/v1/rpc).
revoke execute on function public.crear_perfil_nuevo_usuario() from public, anon, authenticated;
