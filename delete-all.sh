#!/bin/bash
# Script to delete all files from R2 bucket

BUCKET_NAME="jija"

echo "🔍 Fetching list of all files from R2 bucket..."

# Get the list of files as JSON
FILES=$(npx wrangler r2 object list "$BUCKET_NAME" --json 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Error listing files:"
    echo "$FILES"
    exit 1
fi

# Parse and count files (using basic grep/wc)
FILE_COUNT=$(echo "$FILES" | grep -o '"key"' | wc -l)

echo "📊 Found $FILE_COUNT files to delete"

if [ "$FILE_COUNT" -eq 0 ]; then
    echo "✅ No files to delete. Bucket is already empty."
    exit 0
fi

echo ""
echo "⚠️  WARNING: This will delete ALL files from the R2 bucket!"
echo "$FILES"
echo ""
echo "🗑️  Starting deletion..."
echo ""

# Extract keys and delete each one
echo "$FILES" | grep '"key":' | sed 's/.*"key": *"\([^"]*\)".*/\1/' | while read -r key; do
    if [ -n "$key" ]; then
        echo "Deleting: $key"
        npx wrangler r2 object delete "$BUCKET_NAME/$key" 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Deleted: $key"
        else
            echo "❌ Failed to delete: $key"
        fi
    fi
done

echo ""
echo "🎉 Deletion process completed!"
