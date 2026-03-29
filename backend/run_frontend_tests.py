#!/usr/bin/env python3
"""Run frontend TypeScript check."""
import sys
import subprocess
result = subprocess.run(
    ['pnpm', 'exec', 'tsc', '--noEmit'],
    cwd='/Users/szymanski/Projects/easter/frontend',
    capture_output=True,
    text=True
)
print(result.stdout)
print(result.stderr)
sys.exit(result.returncode)
