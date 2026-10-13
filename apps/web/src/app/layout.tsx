import { cookies } from "next/headers";
import { serverSupabase } from "@/lib/supabase/server";
import { DEMO_MODE } from "@/lib/config";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Bengali } from "next/font/google";

import { Providers } from "@/components/providers";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bengali",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Student Support`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_TAGLINE,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demo =
    DEMO_MODE || (await cookies()).get("close-ai-mode")?.value === "demo";
  let userId: string | null = null;
  if (!demo) {
    try {
      const {
        data: { user },
      } = await (await serverSupabase()).auth.getUser();
      userId = user?.id ?? null;
    } catch {
      /* Auth form remains reachable during outages. */
    }
  }
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bengali.variable} ${mono.variable}`}
    >
      <body>
        <Providers demo={demo} userId={userId}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
