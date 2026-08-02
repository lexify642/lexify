import "./globals.css";
import { CasesProvider } from "@/components/cases/CasesContext";
import { AppointmentsProvider } from "@/components/appointments/AppointmentsContext";
import { TasksProvider } from "@/components/tasks/TasksContext";
import { SidebarProvider } from "@/components/layout/SidebarContext";

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
              <SidebarProvider>{children}</SidebarProvider>
            </TasksProvider>
          </AppointmentsProvider>
        </CasesProvider>
      </body>
    </html>
  );
}
