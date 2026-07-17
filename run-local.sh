#!/bin/sh
set -eu

cd "$(dirname "$0")"

if ! command -v mkdocs >/dev/null 2>&1; then
  echo "Error: mkdocs is not installed." >&2
  echo "Install it with: python3 -m pip install mkdocs mkdocs-material" >&2
  exit 1
fi

host="${HOST:-127.0.0.1}"
port="${PORT:-8000}"

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Error: port $port is already in use." >&2
  echo "Use another port with: PORT=8001 ./run-local.sh" >&2
  exit 1
fi

echo "Starting local site at http://${host}:${port}/"
exec mkdocs serve --dev-addr "${host}:${port}"
