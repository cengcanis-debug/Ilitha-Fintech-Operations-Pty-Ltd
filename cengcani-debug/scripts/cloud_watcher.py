#!/usr/bin/env python3
import json
import ssl
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
REGISTRY_PATH = ROOT / "scripts" / "cloud_registry.json"
OUTPUT_PATH = ROOT / "status.json"


def load_registry(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Registry file not found: {path}")

    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    if isinstance(payload, list):
        items = payload
    elif isinstance(payload, dict):
        items = payload.get("sites", [])
    else:
        raise ValueError("Registry must be a JSON array or object with a sites array")

    normalized: list[dict[str, Any]] = []
    for item in items:
        if isinstance(item, str):
            normalized.append({"name": item, "url": item})
        elif isinstance(item, dict) and "url" in item:
            normalized.append(
                {
                    "name": item.get("name") or item.get("url"),
                    "url": item["url"],
                }
            )
    return normalized


def check_url(url: str) -> dict[str, Any]:
    request = Request(url, headers={"User-Agent": "cloud-monitor/1.0"})
    try:
        context = ssl.create_default_context()
        with urlopen(request, timeout=10, context=context) as response:
            return {
                "status": "up",
                "http_code": getattr(response, "status", 200),
                "message": "reachable",
            }
    except URLError as exc:
        return {
            "status": "down",
            "http_code": None,
            "message": str(exc.reason),
        }
    except Exception as exc:  # pragma: no cover - defensive fallback
        return {
            "status": "down",
            "http_code": None,
            "message": str(exc),
        }


def build_report(sites: list[dict[str, Any]]) -> dict[str, Any]:
    results = []
    up_count = 0
    down_count = 0

    for site in sites:
        result = check_url(site["url"])
        if result["status"] == "up":
            up_count += 1
        else:
            down_count += 1
        results.append(
            {
                "name": site["name"],
                "url": site["url"],
                **result,
            }
        )

    overall_status = "up" if down_count == 0 else "degraded"
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "overall_status": overall_status,
        "summary": {
            "total": len(sites),
            "up": up_count,
            "down": down_count,
        },
        "sites": results,
    }


if __name__ == "__main__":
    try:
        sites = load_registry(REGISTRY_PATH)
    except Exception as exc:
        report = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "overall_status": "error",
            "error": str(exc),
            "sites": [],
        }
        OUTPUT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(f"Monitor error: {exc}", file=sys.stderr)
        sys.exit(1)

    report = build_report(sites)
    OUTPUT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
