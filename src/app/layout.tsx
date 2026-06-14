import type { Metadata } from "next";
import { Poppins, Cairo } from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { AuthProvider } from "@/lib/auth/AuthContext";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-poppins" });
const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "Commuter — Egypt's smarter way to share the ride",
  description: "Egypt's leading ride-pooling platform for daily commuters and drivers.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${poppins.variable} ${cairo.variable}`}>
      <body className={`antialiased bg-surface text-primary ${locale === "ar" ? cairo.className : poppins.className}`}>
        <AuthProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
