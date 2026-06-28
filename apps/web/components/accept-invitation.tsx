"use client";

import { useState } from "react";
import Link from "next/link";
import { apiRequest, type ApiEnvelope, type Invitation } from "../lib/api";

export function AcceptInvitation({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "accepted">("idle");
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setStatus("loading");
    setError(null);
    try {
      await apiRequest<ApiEnvelope<Invitation>>(`/invitations/${token}/accept`, {
        method: "POST",
      });
      setStatus("accepted");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to accept invitation.");
      setStatus("idle");
    }
  }

  return (
    <main className="auth-page">
      <div className="container">
        <div className="auth-card">
          <p className="eyebrow">Invitation</p>
          <h1 style={{ margin: 0 }}>Join workspace</h1>
          <p className="row-meta">
            Sign in first, then accept this invitation to add your account to the
            workspace.
          </p>
          {error ? (
            <p className="notice error" role="alert">
              {error}
            </p>
          ) : null}
          {status === "accepted" ? (
            <p className="notice">Invitation accepted. You can open the console now.</p>
          ) : null}
          <div className="form-actions">
            <button
              className="button primary"
              disabled={status === "loading" || status === "accepted"}
              onClick={() => void accept()}
              type="button"
            >
              {status === "loading" ? "Accepting..." : "Accept invitation"}
            </button>
            <Link className="button" href="/dashboard">
              Open console
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
