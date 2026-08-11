import { Nav } from "@/components/nav";
import { requireSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: middleware already guards these routes, but we also make
  // sure every server render has a valid session before touching data.
  await requireSession();

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
