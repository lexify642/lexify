import "./globals.css";

export const metadata = {
  title: "CASEFLOW",
  description: "Legal practice management workspace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
