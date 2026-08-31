#!/bin/sh
set -eu

cd "$(dirname "$0")"

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git is not installed." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed." >&2
  echo "Install Node.js from https://nodejs.org" >&2
  exit 1
fi

branch="$(git branch --show-current)"
if [ "$branch" != "master" ]; then
  echo "Error: deployment must run from the master branch (current: ${branch:-detached HEAD})." >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: the working tree has uncommitted changes. Commit them before deploying." >&2
  exit 1
fi

echo "Installing dependencies..."
npm ci

echo "Validating site build..."
npm run build

echo "Pushing master to GitHub..."
git push origin master

echo "Deployment triggered: https://github.com/jaronlu/jaronlu.github.io/actions"
