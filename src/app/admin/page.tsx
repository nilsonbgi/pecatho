import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminConsole from "./AdminConsole";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["super_admin", "admin", "moderator", "support", "finance"]).limit(1).maybeSingle();
  if (!role) redirect("/painel");

  return <AdminConsole role={String(role.role)} />;
}
