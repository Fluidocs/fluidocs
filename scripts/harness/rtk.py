"""Run the installed RTK with project-local tracking and process-only settings."""
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]


def main():
    executable = shutil.which("rtk")
    if not executable:
        print("RTK não encontrado no PATH.", file=sys.stderr)
        return 127
    if len(sys.argv) < 2:
        print("Uso: python scripts/harness/rtk.py <comando RTK> [argumentos]", file=sys.stderr)
        return 2
    state = ROOT / ".harness-local" / "rtk"
    state.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    env.setdefault("CLAUDE_CONFIG_DIR", str(Path.home() / ".claude"))
    env["RTK_DB_PATH"] = str(state / "history.db")
    env["RTK_TEE_DIR"] = str(state / "tee")
    env["RTK_TELEMETRY_DISABLED"] = "1"
    try:
        return subprocess.call([executable, *sys.argv[1:]], env=env)
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
