"""Check inline local Markdown destinations used by the harness; standard library only."""

import argparse
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
LINK = re.compile(r'!?\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^\s)]+)(?:\s+"[^"\n]*")?\s*\)')


def check(paths: list[Path]) -> int:
    failures = []
    checked = 0
    for path in paths:
        try:
            lines = path.read_text(encoding="utf-8-sig").splitlines()
        except (OSError, UnicodeError) as error:
            failures.append(f"{path}: leitura falhou: {error}")
            continue
        fence = None
        for number, line in enumerate(lines, 1):
            marker = re.match(r"^\s*(`{3,}|~{3,})", line)
            if marker:
                token = marker.group(1)
                if fence is None:
                    fence = token
                elif token[0] == fence[0] and len(token) >= len(fence):
                    fence = None
                continue
            if fence:
                continue
            line = re.sub(r"(`+).*?\1", "", line)
            for match in LINK.finditer(line):
                destination = match.group(1).strip("<>")
                url = urlsplit(destination)
                if url.scheme or url.netloc or not url.path:
                    continue
                checked += 1
                target = path.parent / unquote(url.path)
                if not target.exists():
                    failures.append(f"{path}:{number}: destino ausente: {destination}")
    for failure in failures:
        print(failure)
    print(f"{len(paths)} documentos; {checked} links locais; {len(failures)} falhas.")
    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="*", type=Path,
                        help="Arquivos opcionais, relativos ao diretório atual.")
    args = parser.parse_args()
    paths = args.paths or [
        ROOT / "AGENTS.md", ROOT / "README.md",
        ROOT / "backend/AGENTS.md", ROOT / "backend/README.md",
        ROOT / "frontend/AGENTS.md",
        *sorted((ROOT / "docs/harness").rglob("*.md")),
    ]
    return check(paths)


if __name__ == "__main__":
    raise SystemExit(main())
