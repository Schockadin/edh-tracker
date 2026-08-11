"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { login, type LoginState } from "@/app/login/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Anmelden…" : "Anmelden"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="password" className="label">
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          className="input"
          placeholder="••••••••••"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
