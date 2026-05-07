# Test And Build Results

| Component | Command | Result | Main failure | Fix suggestion |
|----------|---------|--------|--------------|----------------|
| Root | `docker compose config --quiet` | PASS | none | Keep |
| Main | `cd main_service; python -m pytest -q` | PASS, 27 passed | warnings only | Keep tests |
| Observer | `cd observer_experiment; python -m pytest -q` | PASS, 49 passed | none | Keep |
| Session | `cd session/session; python -m pytest -q` | PASS, 21 passed | none | Add converted E2E |
| Feature | `cd feature/feature_svc; python -m pytest -q` | PASS, 13 passed | none | Add contract E2E |
| ML | `cd ml; python -m pytest -q` | PASS, 7 passed | none | Add converted hard-case test |
| Dashboard | `cd cart_analytic; npm run lint` | PASS | none | Keep |
| Dashboard | `cd cart_analytic; npm run build` | PASS | none | Keep |
| Demo | `cd sneaker-store; npm run lint` | PASS with 9 warnings | warnings only | Clean later |
| Demo | `cd sneaker-store; npm run build` | PASS | none | Keep |
| Secret/mock search | `rg` searches | FINDINGS | mock fallbacks/stale docs/defaults | Fix before defense |

Evidence: `docs/defense_evidence/audit_*`.
