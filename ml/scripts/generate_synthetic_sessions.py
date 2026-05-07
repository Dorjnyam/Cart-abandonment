from __future__ import annotations

import argparse
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

import numpy as np
import pandas as pd


FEATURES = [
    "page_load_ms",
    "time_on_page_sec",
    "max_scroll_pct",
    "scroll_up_count",
    "click_count",
    "active_time_ms",
    "tab_hidden_count",
    "copy_count",
    "form_fields_count",
    "form_fields_touched",
    "bounce",
    "session_duration_sec",
    "is_logged_in",
    "selected_quantity",
    "rage_click",
    "outbound_click",
    "checkout_step_detected",
    "js_error",
    "page_view_count",
    "back_navigation",
    "coupon_entered",
    "cart_value",
    "cart_item_count",
    "checkout_step",
    "order_total",
    "is_sale",
    "cart_churn_count",
    "page_views",
    "is_mobile",
    "frustration_index",
    "commitment_depth",
    "price_hesitation_score",
    "mongolian_trust_barrier",
    "avg_price_in_session",
    "dist_product_count",
    "mouse_distance",
    "mouse_speed",
    "direction_changes",
]


def _clip(values, low=0.0, high=None):
    values = np.maximum(values, low)
    if high is not None:
        values = np.minimum(values, high)
    return values


def _sessions(label: int, count: int, rng: np.random.Generator) -> pd.DataFrame:
    abandoned = label == 1
    base = {}
    base["page_load_ms"] = _clip(rng.normal(3100 if abandoned else 1400, 650, count), 250, 8000)
    base["time_on_page_sec"] = _clip(rng.normal(145 if abandoned else 90, 45, count), 5, 420)
    base["max_scroll_pct"] = _clip(rng.normal(68 if abandoned else 82, 18, count), 5, 100)
    base["scroll_up_count"] = rng.poisson(4 if abandoned else 1.5, count)
    base["click_count"] = rng.poisson(18 if abandoned else 11, count)
    base["active_time_ms"] = _clip(base["time_on_page_sec"] * 1000 * rng.uniform(0.45, 0.9, count), 1000, 360000)
    base["tab_hidden_count"] = rng.poisson(2.2 if abandoned else 0.4, count)
    base["copy_count"] = rng.poisson(0.8 if abandoned else 0.15, count)
    base["form_fields_count"] = rng.integers(3, 9, count)
    touch_ratio = rng.uniform(0.35, 0.85, count) if abandoned else rng.uniform(0.75, 1.0, count)
    base["form_fields_touched"] = np.floor(base["form_fields_count"] * touch_ratio)
    base["bounce"] = rng.binomial(1, 0.22 if abandoned else 0.04, count)
    base["session_duration_sec"] = _clip(rng.normal(260 if abandoned else 190, 70, count), 20, 650)
    base["is_logged_in"] = rng.binomial(1, 0.28 if abandoned else 0.62, count)
    base["selected_quantity"] = rng.integers(1, 4, count)
    base["rage_click"] = rng.poisson(2.4 if abandoned else 0.25, count)
    base["outbound_click"] = rng.poisson(0.9 if abandoned else 0.15, count)
    base["checkout_step_detected"] = rng.binomial(1, 0.92 if abandoned else 0.98, count)
    base["js_error"] = rng.poisson(0.75 if abandoned else 0.08, count)
    base["page_view_count"] = rng.poisson(7 if abandoned else 4, count) + 1
    base["back_navigation"] = rng.poisson(2.5 if abandoned else 0.5, count)
    base["coupon_entered"] = rng.binomial(1, 0.42 if abandoned else 0.18, count)
    base["cart_value"] = _clip(rng.normal(330000 if abandoned else 210000, 80000, count), 20000, 800000)
    base["cart_item_count"] = rng.integers(1, 5, count)
    base["checkout_step"] = rng.integers(1, 3 if abandoned else 4, count)
    base["order_total"] = base["cart_value"] * rng.uniform(0.95, 1.08, count)
    base["is_sale"] = rng.binomial(1, 0.35, count)
    base["cart_churn_count"] = rng.poisson(2.1 if abandoned else 0.35, count)
    base["page_views"] = base["page_view_count"]
    base["is_mobile"] = rng.binomial(1, 0.68 if abandoned else 0.45, count)
    base["frustration_index"] = _clip((base["rage_click"] / 5) * 0.45 + (base["js_error"] / 3) * 0.35 + (base["page_load_ms"] / 8000) * 0.2, 0, 1)
    base["commitment_depth"] = _clip((base["checkout_step"] / 4) * 0.55 + (base["cart_item_count"] / 5) * 0.45, 0, 1)
    base["price_hesitation_score"] = _clip(rng.normal(0.62 if abandoned else 0.25, 0.18, count), 0, 1)
    base["mongolian_trust_barrier"] = _clip(rng.normal(0.45 if abandoned else 0.18, 0.16, count), 0, 1)
    base["avg_price_in_session"] = base["cart_value"] / np.maximum(base["cart_item_count"], 1)
    base["dist_product_count"] = rng.poisson(5 if abandoned else 2, count) + 1
    base["mouse_distance"] = _clip(rng.normal(4200 if abandoned else 2600, 900, count), 200, 9000)
    base["mouse_speed"] = _clip(rng.normal(1.8 if abandoned else 1.1, 0.45, count), 0.1, 4.0)
    base["direction_changes"] = rng.poisson(24 if abandoned else 11, count)
    df = pd.DataFrame(base)
    df["label"] = label
    return df


def generate(output: Path, abandoned: int, converted: int, seed: int, ambiguous_rate: float) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    abandoned_ambiguous = int(abandoned * ambiguous_rate)
    converted_ambiguous = int(converted * ambiguous_rate)
    abandoned_clear = abandoned - abandoned_ambiguous
    converted_clear = converted - converted_ambiguous

    abandoned_like_converted = _sessions(0, abandoned_ambiguous, rng)
    abandoned_like_converted["label"] = 1
    converted_like_abandoned = _sessions(1, converted_ambiguous, rng)
    converted_like_abandoned["label"] = 0

    df = pd.concat([
        _sessions(1, abandoned_clear, rng),
        abandoned_like_converted,
        _sessions(0, converted_clear, rng),
        converted_like_abandoned,
    ], ignore_index=True)
    df = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    df.insert(0, "tenant_id", "00000000-0000-0000-0000-000000000001")
    df.insert(0, "visitor_id", [str(uuid5(NAMESPACE_URL, f"visitor-{i}")) for i in range(len(df))])
    df.insert(0, "session_id", [str(uuid5(NAMESPACE_URL, f"session-{i}")) for i in range(len(df))])
    output.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output, index=False)
    return df


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate deterministic synthetic sessions for thesis MVP training.")
    parser.add_argument("--output", type=Path, default=Path("data/sessions.csv"))
    parser.add_argument("--abandoned", type=int, default=600)
    parser.add_argument("--converted", type=int, default=600)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--ambiguous-rate", type=float, default=0.18)
    args = parser.parse_args()
    df = generate(args.output, args.abandoned, args.converted, args.seed, args.ambiguous_rate)
    print(f"Wrote {len(df)} rows to {args.output}")


if __name__ == "__main__":
    main()
