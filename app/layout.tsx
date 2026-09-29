import { AuthProvider } from "@/components/session-provider";
import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Helpy | Your personal AI workspace",
  description:
    "Create helpful AI agents and bring your conversations into one thoughtful workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
