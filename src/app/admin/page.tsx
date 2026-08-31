import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminConsole from "./AdminConsole";
import BootstrapAdmin from "./BootstrapAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["super_admin", "admin", "moderator", "support", "finance"]).limit(1).maybeSingle();
  if (role) return <AdminConsole role={String(role.role)} />;

  const { count } = await supabase.from("user_roles").select("user_id", { count: "exact", head: true });
  if (count === 0) return <BootstrapAdmin />;

  redirect("/painel");
}
