import { timingSafeEqual } from "crypto";

/** Env дээр суурилсан admin-д зориулсан тогтвортой JWT/database-free id; бодит User id-тай давхцах ёсгүй. */
export const ENV_ADMIN_USER_ID = "clenvadminstatic00";

export function isEnvAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD);
}

/** Урт таарах үед constant-time харьцуулж, timingSafeEqual throw-оор урт ил гарахаас сэргийлнэ. */
export function verifyEnvAdminCredentials(email: string, password: string): boolean {
  const wantEmail = process.env.ADMIN_EMAIL?.trim();
  const wantPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!wantEmail || !wantPassword) return false;
  const gotEmail = email.trim();
  const a = Buffer.from(gotEmail, "utf8");
  const b = Buffer.from(wantEmail, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const p1 = Buffer.from(password, "utf8");
  const p2 = Buffer.from(wantPassword, "utf8");
  if (p1.length !== p2.length) return false;
  return timingSafeEqual(p1, p2);
}
