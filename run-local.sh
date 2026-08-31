#!/bin/sh
set -eu

cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed." >&2
  echo "Install Node.js from https://nodejs.org" >&2
  exit 1
fi

host="${HOST:-127.0.0.1}"
port="${PORT:-5173}"

if command -v lsof >/dev/null 2>&1; then
  pids="$(lsof -t -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "Port $port is already in use; stopping the existing listener."
    if ! kill $pids 2>/dev/null; then
      echo "Error: failed to stop the process using port $port." >&2
      exit 1
    fi

    attempts=0
    while lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
      attempts=$((attempts + 1))
      if [ "$attempts" -ge 50 ]; then
        echo "Error: port $port was not released after 5 seconds." >&2
        exit 1
      fi
      sleep 0.1
    done
  fi
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting local site at http://${host}:${port}/"
exec npm run dev -- --host "${host}" --port "${port}"
