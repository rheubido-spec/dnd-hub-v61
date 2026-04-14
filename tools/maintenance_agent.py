#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run_step(label: str, command: list[str], cwd: Path) -> int:
    print(f"\n==> {label}")
    print(' '.join(command))
    completed = subprocess.run(command, cwd=cwd)
    return completed.returncode


def main() -> int:
    parser = argparse.ArgumentParser(description='Run the D&D Hub maintenance workflow.')
    parser.add_argument('--with-playwright', action='store_true', help='Run the browser smoke suite after backend and frontend checks.')
    args = parser.parse_args()

    failures = 0
    failures += run_step('Backend smoke tests', [sys.executable, '-m', 'pytest', 'tests/test_smoke.py'], ROOT / 'backend')
    failures += run_step('Frontend production build', ['npm', 'run', 'build'], ROOT / 'frontend')
    if args.with_playwright:
        failures += run_step('Frontend Playwright smoke tests', ['npm', 'run', 'test:e2e'], ROOT / 'frontend')

    if failures:
        print('\nMaintenance workflow finished with failures.')
        return 1

    print('\nMaintenance workflow finished successfully.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
