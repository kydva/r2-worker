#!/bin/bash
# Script to delete all files from R2 bucket using curl

WORKER_URL="https://r2-worker.jija.workers.dev"

echo "🔍 Fetching list of all files..."

# Get the list of files
FILES_JSON=$(curl -s "${WORKER_URL}/_list")

if [ $? -ne 0 ]; then
    echo "❌ Error fetching file list"
    exit 1
fi

# Count files
FILE_COUNT=$(echo "$FILES_JSON" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")

echo "📊 Found $FILE_COUNT files to delete"

if [ "$FILE_COUNT" -eq 0 ]; then
    echo "✅ No files to delete. Bucket is already empty."
    exit 0
fi

echo ""
echo "⚠️  WARNING: This will delete ALL files from the R2 bucket!"
echo "Files:"
echo "$FILES_JSON" | python3 -m json.tool | grep '"key"' | head -20
echo ""
read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🗑️  Starting deletion..."
echo ""

SUCCESS=0
FAILED=0

# Parse JSON and delete each file
echo "$FILES_JSON" | python3 -c "
import sys, json, urllib.parse
files = json.load(sys.stdin)
for f in files:
    print(urllib.parse.quote(f['key'], safe=''))
" | while read -r encoded_key; do
    if [ -n "$encoded_key" ]; then
        # Decode for display
        decoded_key=$(python3 -c "import urllib.parse; print(urllib.parse.unquote('$encoded_key'))")
        echo "Deleting: $decoded_key"
        
        response=$(curl -s -w "%{http_code}" -X DELETE "${WORKER_URL}/${encoded_key}")
        http_code="${response: -3}"
        
        if [ "$http_code" = "200" ]; then
            echo "✅ Deleted: $decoded_key"
            ((SUCCESS++))
        else
            echo "❌ Failed to delete: $decoded_key (HTTP $http_code)"
            ((FAILED++))
        fi
    fi
done

echo ""
echo "📊 Deletion Summary:"
echo "  ✅ Successfully deleted: $SUCCESS files"
echo "  ❌ Failed: $FAILED files"
echo ""
echo "🎉 Deletion process completed!"
