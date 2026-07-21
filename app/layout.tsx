import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Chat Assistant — Built by Muhammad Anees",
  description:
    "A full-stack AI chat application featuring streaming LLM responses, real-time WebSocket sync, contextual memory summarization, and voice I/O. Built by Muhammad Anees for Internee.pk.",
  openGraph: {
    title: "AI Chat Assistant — Built by Muhammad Anees",
    description:
      "Full-stack AI chat with streaming responses, WebSocket real-time sync, contextual memory summarization & voice I/O.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" data-theme="light">
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
