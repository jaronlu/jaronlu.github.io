#!/bin/sh
set -eu

cd "$(dirname "$0")"

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git is not installed." >&2
  exit 1
fi

if ! command -v mkdocs >/dev/null 2>&1; then
  echo "Error: mkdocs is not installed." >&2
  echo "Install it with: python3 -m pip install mkdocs mkdocs-material" >&2
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

echo "Validating site build..."
mkdocs build --strict

echo "Pushing master to GitHub..."
git push origin master

echo "Deployment triggered: https://github.com/jaronlu/jaronlu.github.io/actions"
