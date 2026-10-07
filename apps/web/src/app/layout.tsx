import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "DevMentor AI — Your Autonomous CS & CP Companion",
  description:
    "Personalized AI mentor for CS students, competitive programmers, and developers: study plans, Codeforces practice, snippets, and code help.",
};

// Set theme class before paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
