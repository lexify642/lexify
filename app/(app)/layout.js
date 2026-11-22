import { redirect } from "next/navigation";
import { getSessionAndProfile } from "@/lib/supabase/server";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { StaffDirectoryProvider } from "@/components/staff/StaffDirectoryContext";
import { CasesProvider } from "@/components/cases/CasesContext";
import { AppointmentsProvider } from "@/components/appointments/AppointmentsContext";
import { TasksProvider } from "@/components/tasks/TasksContext";
import { ChatProvider } from "@/components/chat/ChatContext";
import { AttachmentsProvider } from "@/components/chat/AttachmentsContext";
import { DraftsProvider } from "@/components/draft/DraftsContext";
import { DraftCommentsProvider } from "@/components/draft/DraftCommentsContext";
import { DraftReviewProvider } from "@/components/draft/DraftReviewContext";
import { ClauseWorkspaceProvider } from "@/components/draft/ClauseWorkspaceContext";
import { ClausesProvider } from "@/components/draft/ClausesContext";
import { LegalDraftsProvider } from "@/components/legal-drafts/LegalDraftsContext";

// Everything under this route group is the authenticated workspace.
// middleware.js already redirects unauthenticated requests away, but this
// layout re-checks server-side (defense in depth — a Server Component
// layout can't be bypassed the way client-only checks can) before any
// provider or page below it ever mounts.
export default async function AppLayout({ children }) {
  const { user, profile } = await getSessionAndProfile();
  if (!user) redirect("/login");
  if (!profile || !profile.is_active) redirect("/login?error=account-not-set-up");

  const currentUser = {
    id: user.id,
    email: user.email,
    name: profile.full_name || user.email,
    role: profile.role,
  };

  return (
    <AuthProvider user={currentUser}>
      <StaffDirectoryProvider>
        <CasesProvider>
          <AppointmentsProvider>
            <TasksProvider>
              <AttachmentsProvider>
                <ChatProvider>
                  <DraftsProvider>
                    <DraftCommentsProvider>
                      <DraftReviewProvider>
                        <LegalDraftsProvider>
                          <ClausesProvider>
                            <ClauseWorkspaceProvider>{children}</ClauseWorkspaceProvider>
                          </ClausesProvider>
                        </LegalDraftsProvider>
                      </DraftReviewProvider>
                    </DraftCommentsProvider>
                  </DraftsProvider>
                </ChatProvider>
              </AttachmentsProvider>
            </TasksProvider>
          </AppointmentsProvider>
        </CasesProvider>
      </StaffDirectoryProvider>
    </AuthProvider>
  );
}
