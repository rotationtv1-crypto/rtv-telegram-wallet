#!/usr/bin/env python3
"""
RTV HeyGen Master Mode — Ecosystem Video Generation
Routes video creation by company, template, and event type
RotationTV Network — "Learn it. Live it. Love it."
"""

import os, json, subprocess, sys, argparse
from pathlib import Path

SKILL_DIR = Path(__file__).parent
COMPANIES = json.loads((SKILL_DIR / "companies.json").read_text())["companies"]
TEMPLATES_DIR = SKILL_DIR / "templates"
HEYGEN_BIN = os.path.expanduser("~/.local/bin/heygen")

def get_company(company_id: str) -> dict:
    for c in COMPANIES:
        if c["id"] == company_id:
            return c
    raise ValueError(f"Unknown company: {company_id}. Available: {[c['id'] for c in COMPANIES]}")

def load_template(template_name: str) -> str:
    path = TEMPLATES_DIR / f"{template_name}.md"
    if path.exists():
        return path.read_text()
    return f"Template not found: {template_name}"

def generate_payload(company_id: str, event_type: str = "intro", custom_script: str = None) -> dict:
    company = get_company(company_id)
    template = load_template(company["default_template"])

    script = custom_script or f"""
    {company['name']} — {event_type.upper()} update.
    Powered by RotationTV Network.
    Learn it. Live it. Love it.
    """

    payload = {
        "company": company["name"],
        "rtv_module": company["rtv_module"],
        "event_type": event_type,
        "video_tone": company["video_tone"],
        "script": script.strip(),
        "settings": {
            "aspect_ratio": "16:9",
            "voice_tone": company["video_tone"],
            "style": company["avatar_style"],
        },
        "webhook_target": "https://api.base44.com/api/apps/69db6144f66afe8317b2d0d7/functions/rotationPayWebhook",
        "webhook_payload": {
            "source": "heygen",
            "event_type": "video_completed",
            "title": f"{company['name']} Video — {event_type}",
            "priority": "normal",
            "rtv_module": company["rtv_module"],
        }
    }
    return payload

def run_heygen_cli(args: list) -> dict:
    api_key = os.environ.get("HEYGEN_API_KEY", "")
    env = {**os.environ, "HEYGEN_API_KEY": api_key, "PATH": f"/root/.local/bin:{os.environ.get('PATH','')}"}
    result = subprocess.run([HEYGEN_BIN] + args, capture_output=True, text=True, env=env)
    try:
        return json.loads(result.stdout)
    except:
        return {"stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}

def main():
    parser = argparse.ArgumentParser(description="RTV HeyGen Master Mode")
    parser.add_argument("--company", default="rotationtvnetwork", help="Company ID")
    parser.add_argument("--event", default="intro", help="Event type")
    parser.add_argument("--script", help="Custom script override")
    parser.add_argument("--list-companies", action="store_true")
    parser.add_argument("--list-avatars", action="store_true")
    parser.add_argument("--auth-status", action="store_true")
    parser.add_argument("--payload-only", action="store_true", help="Print payload without generating")

    args = parser.parse_args()

    if args.list_companies:
        print(json.dumps([{"id": c["id"], "name": c["name"], "module": c["rtv_module"]} for c in COMPANIES], indent=2))
        return

    if args.auth_status:
        result = run_heygen_cli(["auth", "status"])
        print(json.dumps(result, indent=2))
        return

    if args.list_avatars:
        result = run_heygen_cli(["avatar", "list"])
        print(json.dumps(result, indent=2))
        return

    payload = generate_payload(args.company, args.event, args.script)
    print(json.dumps(payload, indent=2))

if __name__ == "__main__":
    main()
