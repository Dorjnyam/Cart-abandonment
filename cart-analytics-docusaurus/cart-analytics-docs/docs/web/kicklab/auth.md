---
id: auth
title: KICKLAB — Authentication
sidebar_label: Auth
---

# Authentication & Authorization

## Нэвтрэлтийн аргууд

| Арга | Тайлбар |
|------|---------|
| Email + Password | bcrypt hash, `User.password`-д хадгалагдана |
| Google OAuth | `GOOGLE_CLIENT_ID/SECRET` тохируулбал идэвхждэг |

**Session:** NextAuth JWT strategy — database session биш

## Хэрэглэгчийн дүрүүд

| Дүр | Эрх |
|-----|-----|
| **Admin** | `/admin/*` — catalog, захиалга, coupon, analytics |
| **Customer** (default) | Catalog, cart, checkout, өөрийн захиалга |

## Admin хандах 2 арга

**1. Env-based:**
```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strong-password
```
→ Synthetic admin (id: `clenvadminstatic00`) үүснэ

**2. Database:**
```sql
UPDATE "User" SET role = 'admin' WHERE email = 'admin@example.com';
```

## Admin Protection

`requireAdminUser()` middleware нь admin route-уудыг хамгаалдаг:

```typescript
// Дотоод логик
const session = await getServerSession(authOptions);
if (session?.user?.role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```
