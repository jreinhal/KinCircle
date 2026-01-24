#!/bin/bash

# Utility script to automate adding, committing, and pushing changes.
# Usage: ./git_sync.sh "Your commit message"

if [ -z "$1" ]
then
    echo "Error: No commit message provided."
    echo "Usage: ./git_sync.sh \"Your commit message\""
    exit 1
fi

echo "🚀 Staging changes..."
git add .

echo "📦 Committing with message: \"$1\"..."
git commit -m "$1"

echo "☁️ Pushing to remote..."
git push

echo "✅ Done! Code is synced."