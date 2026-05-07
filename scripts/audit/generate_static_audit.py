from __future__ import annotations

import ast
import json
import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "final_audit"
EVIDENCE = ROOT / "docs" / "defense_evidence"
SKIP_PARTS = {".git", ".next", "node_modules", "__pycache__", ".pytest_cache", ".conda"}


AREAS = {
    "Main service": ["main_service"],
    "Observer service": ["observer_experiment"],
    "Session service": ["session/session"],
    "Feature service": ["feature/feature_svc"],
    "ML service": ["ml"],
    "Analytics dashboard": ["cart_analytic"],
    "Demo ecommerce": ["sneaker-store"],
    "Docs": ["docs"],
    "Root scripts": ["scripts"],
}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def wanted(path: Path) -> bool:
    return not any(part in SKIP_PARTS for part in path.parts)


def files(*patterns: str) -> list[Path]:
    result: list[Path] = []
    for pattern in patterns:
        result.extend(p for p in ROOT.glob(pattern) if p.is_file() and wanted(p))
    return sorted(set(result), key=lambda p: rel(p))


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="replace")


def package_inventory() -> dict[str, list[str]]:
    patterns = [
        "**/package.json",
        "**/requirements*.txt",
        "**/pyproject.toml",
        "**/Dockerfile",
        "**/docker-compose*.yml",
        "**/docker-compose*.yaml",
        "**/.env.example",
        "**/pytest.ini",
        "**/README.md",
    ]
    return {pattern: [rel(p) for p in files(pattern)] for pattern in patterns}


def route_decorators(node: ast.AST) -> list[str]:
    routes: list[str] = []
    for deco in getattr(node, "decorator_list", []):
        if isinstance(deco, ast.Call):
            func = deco.func
            name = ""
            if isinstance(func, ast.Attribute):
                base = getattr(func.value, "id", "")
                name = f"{base}.{func.attr}"
            elif isinstance(func, ast.Name):
                name = func.id
            if name.startswith("app.") or name.startswith("router.") or name in {"api_view"}:
                args = []
                for arg in deco.args:
                    if isinstance(arg, ast.Constant):
                        args.append(repr(arg.value))
                routes.append(f"@{name}({', '.join(args)})")
    return routes


def called_names(node: ast.AST) -> list[str]:
    names: set[str] = set()
    for child in ast.walk(node):
        if isinstance(child, ast.Call):
            func = child.func
            if isinstance(func, ast.Name):
                names.add(func.id)
            elif isinstance(func, ast.Attribute):
                names.add(func.attr)
    return sorted(names)


def py_inventory() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    test_files = {p for p in files("**/tests/**/*.py", "**/test_*.py", "**/*tests.py")}
    for path in files("main_service/**/*.py", "observer_experiment/**/*.py", "session/session/**/*.py", "feature/feature_svc/**/*.py", "ml/**/*.py"):
        text = read_text(path)
        try:
            tree = ast.parse(text)
        except SyntaxError as exc:
            rows.append({"file": rel(path), "kind": "parse_error", "name": str(exc), "line": 0})
            continue
        service = service_for(path)
        for node in ast.iter_child_nodes(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                rows.append({
                    "service": service,
                    "file": rel(path),
                    "kind": "async function" if isinstance(node, ast.AsyncFunctionDef) else "function",
                    "name": node.name,
                    "line": node.lineno,
                    "routes": route_decorators(node),
                    "calls": called_names(node)[:24],
                    "tested": is_tested(node.name, text, test_files),
                    "risk": risk_for_py(path, node.name, route_decorators(node), text),
                })
            elif isinstance(node, ast.ClassDef):
                bases = []
                for base in node.bases:
                    if isinstance(base, ast.Name):
                        bases.append(base.id)
                    elif isinstance(base, ast.Attribute):
                        bases.append(base.attr)
                rows.append({
                    "service": service,
                    "file": rel(path),
                    "kind": "class",
                    "name": node.name,
                    "line": node.lineno,
                    "routes": [],
                    "calls": [],
                    "tested": is_tested(node.name, text, test_files),
                    "risk": risk_for_class(path, node.name, bases),
                })
                for method in [n for n in node.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]:
                    rows.append({
                        "service": service,
                        "file": rel(path),
                        "kind": "method",
                        "name": f"{node.name}.{method.name}",
                        "line": method.lineno,
                        "routes": route_decorators(method),
                        "calls": called_names(method)[:24],
                        "tested": is_tested(method.name, text, test_files) or is_tested(node.name, text, test_files),
                        "risk": risk_for_py(path, method.name, route_decorators(method), text),
                    })
    return rows


def service_for(path: Path) -> str:
    rp = rel(path)
    for name, prefixes in AREAS.items():
        if any(rp.startswith(prefix + "/") or rp == prefix for prefix in prefixes):
            return name
    return "Other"


def is_tested(name: str, source_text: str, test_files: set[Path]) -> bool:
    if name.startswith("test_"):
        return True
    pattern = re.compile(rf"\b{re.escape(name)}\b")
    return any(pattern.search(read_text(path)) for path in test_files)


def risk_for_class(path: Path, name: str, bases: list[str]) -> str:
    if "models.py" in path.name or "Model" in bases:
        return "DB model contract"
    if "View" in name or "APIView" in bases:
        return "API endpoint contract"
    if "Consumer" in name or "Producer" in name:
        return "Kafka/runtime contract"
    return ""


def risk_for_py(path: Path, name: str, routes: list[str], text: str) -> str:
    rp = rel(path)
    lowered = f"{rp} {name} {text[:500]}".lower()
    flags = []
    if routes:
        flags.append("API route")
    if "kafka" in lowered or "consumer" in lowered or "producer" in lowered:
        flags.append("Kafka path")
    if "s1" in lowered or "dominant" in lowered or "diagnosis" in lowered:
        flags.append("diagnosis/S1-S7")
    if "gemini" in lowered or "recommendation" in lowered:
        flags.append("recommendation")
    if "secret" in lowered or "api_key" in lowered:
        flags.append("auth/security")
    if "model" in lowered or "predict" in lowered or "xgboost" in lowered:
        flags.append("ML")
    return ", ".join(dict.fromkeys(flags))


TS_DECL = re.compile(
    r"^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)|"
    r"^(?:export\s+)?(?:const|let)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(|"
    r"^(?:export\s+)?(?:default\s+)?class\s+([A-Za-z0-9_]+)|"
    r"^export\s+default\s+function\s+([A-Za-z0-9_]+)",
    re.MULTILINE,
)


def ts_inventory() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for path in files("cart_analytic/src/**/*.ts", "cart_analytic/src/**/*.tsx", "sneaker-store/src/**/*.ts", "sneaker-store/src/**/*.tsx", "sneaker-store/public/**/*.js", "observer_experiment/observer/snippet/**/*.js"):
        text = read_text(path)
        frontend = "Analytics dashboard" if rel(path).startswith("cart_analytic/") else "Demo ecommerce/tracker"
        for match in TS_DECL.finditer(text):
            name = next(group for group in match.groups() if group)
            rows.append({
                "frontend": frontend,
                "file": rel(path),
                "component_or_function": name,
                "line": text[:match.start()].count("\n") + 1,
                "data_source": data_source_for_ts(text),
                "mock": bool(re.search(r"mock|fake|sample|NEXT_PUBLIC_MOCK_FALLBACK", text, re.I)),
                "risk": risk_for_ts(path, name, text),
            })
    return rows


def data_source_for_ts(text: str) -> str:
    if "apiRequest" in text or "apiClient" in text:
        return "Main API"
    if "fetch(" in text and "OBSERVER" in text:
        return "Observer API"
    if "window.__OBSERVER" in text or "sendEvent" in text:
        return "Observer tracker"
    if "useCart" in text or "prisma" in text.lower():
        return "Demo app state/DB"
    return ""


def risk_for_ts(path: Path, name: str, text: str) -> str:
    flags = []
    if "NEXT_PUBLIC_MOCK_FALLBACK" in text:
        flags.append("mock guarded")
    elif re.search(r"\bMOCK_|mock|fake|sample", text, re.I):
        flags.append("mock/static data")
    if "S1" in text or "dominant" in text:
        flags.append("S1-S7 mapping")
    if "apiRequest" in text or "apiClient" in text:
        flags.append("API mapping")
    if "fetch(" in text and "OBSERVER" in text:
        flags.append("event emission")
    return ", ".join(flags)


def write_markdown_inventory(py_rows: list[dict[str, object]], ts_rows: list[dict[str, object]]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    pkg = package_inventory()
    (EVIDENCE / "static_inventory.json").write_text(
        json.dumps({"packages": pkg, "python": py_rows, "frontend": ts_rows}, indent=2),
        encoding="utf-8",
    )

    lines = ["# Repository Inventory", ""]
    lines.append("| Area | Path | Exists? | Main files | Status | Notes |")
    lines.append("|------|------|---------|------------|--------|-------|")
    for area, prefixes in AREAS.items():
        for prefix in prefixes:
            path = ROOT / prefix
            exists = path.exists()
            main = []
            if exists and path.is_dir():
                main = [p.name for p in sorted(path.iterdir()) if wanted(p)][:12]
            lines.append(f"| {area} | `{prefix}` | {'yes' if exists else 'no'} | {', '.join(main)} | {'present' if exists else 'missing'} | static discovery |")
    lines.append("")
    lines.append("## Package And Runtime Files")
    for pattern, paths in pkg.items():
        lines.append(f"- `{pattern}`: {len(paths)}")
        for p in paths[:40]:
            lines.append(f"  - `{p}`")
    (OUT / "repository_inventory.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    lines = ["# Function And Class Inventory", ""]
    lines.append("| Service | File | Function/Class | Responsibility | Called by | Calls | Tested? | Risk |")
    lines.append("|---------|------|----------------|----------------|-----------|-------|---------|------|")
    for row in py_rows:
        calls = ", ".join(row.get("calls", [])[:8])
        routes = "; ".join(row.get("routes", []))
        lines.append(
            f"| {row.get('service','')} | `{row['file']}:{row['line']}` | `{row['kind']} {row['name']}` | {routes or row.get('kind','')} | static AST | {calls} | {row.get('tested')} | {row.get('risk','')} |"
        )
    lines.append("")
    lines.append("## Frontend Inventory")
    lines.append("| Frontend | File | Component/Function | Responsibility | Data source | Mock? | Risk |")
    lines.append("|----------|------|--------------------|----------------|-------------|-------|------|")
    for row in ts_rows:
        lines.append(
            f"| {row['frontend']} | `{row['file']}:{row['line']}` | `{row['component_or_function']}` | static parse | {row['data_source']} | {row['mock']} | {row['risk']} |"
        )
    (OUT / "function_inventory.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    py_rows = py_inventory()
    ts_rows = ts_inventory()
    write_markdown_inventory(py_rows, ts_rows)
    print(json.dumps({"python_items": len(py_rows), "frontend_items": len(ts_rows), "out": rel(OUT)}, indent=2))


if __name__ == "__main__":
    main()
