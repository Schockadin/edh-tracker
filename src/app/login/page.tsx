import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Anmelden",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-8 px-6">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="text-center flex flex-col items-center">
        <div className="rounded-[16px] overflow-hidden">
          <Image
            src="/icons/apple/apple-touch-icon-180x180.png"
            alt="EDH-Tracker Icon"
            width={180}
            height={180}
          />
        </div>
        <h1 className="text-2xl font-bold">EDH Tracker</h1>
        <p className="mt-1 text-sm text-muted">
          Dein persönlicher Commander-Tracker
        </p>
      </div>
      <div className="card w-full">
        <LoginForm />
      </div>
    </main>
  );
}
