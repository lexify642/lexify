import "./globals.css";
import { CasesProvider } from "@/components/cases/CasesContext";
import { AppointmentsProvider } from "@/components/appointments/AppointmentsContext";
import { TasksProvider } from "@/components/tasks/TasksContext";
import { ChatProvider } from "@/components/chat/ChatContext";
import { AttachmentsProvider } from "@/components/chat/AttachmentsContext";

export const metadata = {
  title: "LEXIFY",
  description: "Legal practice management workspace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <CasesProvider>
          <AppointmentsProvider>
            <TasksProvider>
              <AttachmentsProvider>
                <ChatProvider>{children}</ChatProvider>
              </AttachmentsProvider>
            </TasksProvider>
          </AppointmentsProvider>
        </CasesProvider>
      </body>
    </html>
  );
}
