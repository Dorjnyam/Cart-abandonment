# Security And Secrets Review

| Secret/security issue | Evidence | Current safe? | Must rotate? | Severity | Fix |
|----------------------|----------|---------------|--------------|----------|-----|
| Tracked env examples | `git ls-files` found service `.env.example` files | Safe if placeholders only | No | Low | Keep examples placeholder-only |
| Demo API key/password defaults | `tk_full_demo_mvp`, `change-me-demo-password` in config/scripts | Safe only for local demo | Yes if ever deployed | Medium | Never use in public deployment |
| Build placeholder NextAuth secret | `cart_analytic/Dockerfile` | Safe placeholder if overridden | Yes for deployment | Medium | Require env at runtime |
| PostgreSQL default password | compose/env examples | Safe local only | Yes for deployment | Medium | Replace in deployed env |
| Gemini key | Search found no obvious real key pattern | Safe | No | Low | Keep untracked |
| CORS/auth | Settings and service configs | PARTIAL | n/a | Medium | Restrict origins outside demo |
| Tenant filtering | Main code supports tenant; E2E only demo tenant | PARTIAL | n/a | Medium | Add cross-tenant negative tests |
| Mock data exposure | dashboard auxiliary services | Unsafe for thesis normal mode | n/a | High | Gate every mock behind env flag |

Evidence: `docs/defense_evidence/audit_secret_search_refined.txt`, `git status --short` output from audit.
