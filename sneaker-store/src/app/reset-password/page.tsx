"use client";

import { useState } from "react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-3">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button
        type="button"
        className="w-full rounded border px-3 py-2 text-sm"
        onClick={async () => {
          const res = await fetch("/api/auth/password-reset/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          if (data.token) setToken(data.token);
          setMsg("Reset token generated.");
        }}
      >
        Request token
      </button>
      <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Token" value={token} onChange={(e) => setToken(e.target.value)} />
      <input className="w-full rounded border px-3 py-2 text-sm" placeholder="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button
        type="button"
        className="w-full rounded-full bg-black px-3 py-2 text-sm text-white"
        onClick={async () => {
          const res = await fetch("/api/auth/password-reset/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password }),
          });
          setMsg(res.ok ? "Password updated." : "Failed to reset password.");
        }}
      >
        Confirm reset
      </button>
      {!!msg && <p className="text-sm text-zinc-600">{msg}</p>}
    </div>
  );
}

