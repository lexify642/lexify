import "./globals.css";
import { CasesProvider } from "@/components/cases/CasesContext";
import { AppointmentsProvider } from "@/components/appointments/AppointmentsContext";

export const metadata = {
  title: "LEXIFY",
  description: "Legal practice management workspace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <CasesProvider>
          <AppointmentsProvider>{children}</AppointmentsProvider>
        </CasesProvider>
      </body>
    </html>
  );
}
