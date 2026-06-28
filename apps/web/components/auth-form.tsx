"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, type ApiEnvelope, type User } from "../lib/api";

type Mode = "login" | "register";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    setError(null);
    const payload =
      mode === "register"
        ? {
            name: formString(formData, "name"),
            email: formString(formData, "email"),
            password: formString(formData, "password"),
          }
        : {
            email: formString(formData, "email"),
            password: formString(formData, "password"),
          };

    try {
      await apiRequest<ApiEnvelope<{ user: User }>>(`/auth/${mode}`, {
        method: "POST",
        json: payload,
      });
      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={submit} className="auth-card">
      <p className="eyebrow">{mode === "register" ? "New workspace" : "Welcome back"}</p>
      <h1 style={{ margin: 0 }}>
        {mode === "register" ? "Create your account" : "Sign in"}
      </h1>
      <p className="row-meta">
        Use the seeded demo account after running the seed, or create a fresh account
        locally.
      </p>
      {mode === "register" ? (
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" autoComplete="name" minLength={2} required />
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          minLength={mode === "register" ? 10 : 1}
          required
        />
      </div>
      {error ? (
        <p className="notice error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="form-actions">
        <button className="button primary" disabled={loading} type="submit">
          {loading ? "Working..." : mode === "register" ? "Create account" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
