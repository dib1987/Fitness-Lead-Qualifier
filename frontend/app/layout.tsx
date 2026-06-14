import "./globals.css";

export const metadata = { title: "Lead Engine", description: "Multi-tenant lead capture and nurture" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
