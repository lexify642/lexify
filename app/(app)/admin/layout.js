import { redirect } from "next/navigation";
import { getSessionAndProfile } from "@/lib/supabase/server";

// (app)/layout.js already guarantees a session + active profile exists by
// the time this runs — this only adds the admin-role check, so a non-admin
// staff member (who can still see every other workspace page) gets bounced
// from firm-administration screens specifically. Hiding the sidebar link
// (Sidebar.jsx) is cosmetic; this is the real, server-side gate.
export default async function AdminLayout({ children }) {
  const { profile } = await getSessionAndProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }
  return children;
}
