# Event Contract Audit

| Event | Demo emits? | Observer accepts? | DB saved? | raw_events? | Session effect | Feature effect | ML effect | S1-S7 effect | Dashboard visible? | Gap |
|-------|-------------|-------------------|-----------|-------------|----------------|----------------|-----------|--------------|--------------------|-----|
| page_view | Yes | Yes | PASS | PASS | Starts session | page/time features | Indirect | S6/S7 context | UC1 no, UC2/UC3 persisted | UC1 lost after ML |
| product_view | Yes | Yes | PASS | PASS | Keeps active | product/category features | Indirect | S5/S6 | UC1 no, UC2/UC3 persisted | `product_name` not retained |
| add_to_cart | Yes | Yes | PASS | PASS | cart intent | cart features | Direct | S5/S6 | UC1 no, UC2/UC3 persisted | none |
| remove_from_cart | Code supports | Accepted | Not in use cases | Topic exists | cart reduction | cart features | Direct | S5/S6 | Not verified | Need deterministic UI event proof |
| cart_view | Yes | Yes | PASS | PASS | cart intent | cart repeat features | Direct | S5/S6 | UC1 no, UC2/UC3 persisted | none |
| checkout_start | Yes | Yes | PASS | PASS | checkout intent | checkout features | Direct | S2/S5 | UC1 no, UC2/UC3 persisted | none |
| checkout_error | Yes | Yes | PASS | PASS | friction signal | error features | Direct | S2/S4 | UC1 no | `error_type` not retained explicitly |
| abandon_checkout | Yes | Yes | PASS | PASS | abandoned terminal | abandonment features | Direct | all S1-S7 | UC3 persisted | UC1 not saved by Main |
| purchase_success | Yes | Yes | PASS | PASS | converted terminal expected | purchase signal | Direct | Should suppress abandonment | FAIL | UC2 treated as abandoned |

Schema result:
- Common fields are partially present: `event_type`, `session_id`, timestamp, path/page URL, API key, device/referrer/payload are supported.
- Tenant is preserved in payload during E2E: see `db_raw_events_after_e2e.txt`.
- Commerce fields are partial. `observer_experiment/observer/models/payload.py::EventPayload` includes product id/category/price, payment method, order total, discount code. It does not explicitly retain `product_name`, `shipping_cost`, `discount`, `error_type`, or `order_id` because unknown fields are ignored.
