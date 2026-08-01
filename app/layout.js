import "./globals.css";
import { CasesProvider } from "@/components/cases/CasesContext";

export const metadata = {
  title: "LEXIFY",
  description: "Legal practice management workspace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <CasesProvider>{children}</CasesProvider>
      </body>
    </html>
  );
}
