import type { Metadata } from "next";
import "./globals.css";
import "./voltis-overrides.css";
import { AuthProvider } from "../components/AuthProvider";

export const metadata: Metadata = {
  title: "VOLTIS | Payment & Ledger Infrastructure",
  description:
    "VOLTIS — Payment processing, double-entry ledger, reconciliation, risk, and financial infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
