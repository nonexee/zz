import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="theme-blue-scaled">
        <ThemeProvider
          attribute="class"
          defaultTheme="blue-scaled"
          enableSystem
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
