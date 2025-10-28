#!/bin/bash

# Configuration
VAULT="/Users/lynx/Library/Mobile Documents/iCloud~md~obsidian/Documents/Main vault 2"
WORKER_URL="https://r2-worker.jija.workers.dev"
PARALLEL_JOBS=4   # Number of parallel uploads

cd "$VAULT" || exit

# Function to upload a single file
upload_file() {
    file="$1"
    key="${file#./}"   # preserve folder structure
    
    # URL encode the key using Python (available on macOS by default)
    encoded_key=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$key', safe='/'))")
    
    # Use -s (silent), -m 60 (60 second timeout)
    # Removed --fail to see actual error messages
    RESPONSE=$(curl -s -m 60 -X PUT --data-binary @"$file" "$WORKER_URL/$encoded_key" 2>&1)
    
    # If the RESPONSE is still empty, it likely means a severe timeout or connection issue.
    if [ -z "$RESPONSE" ]; then
        RESPONSE="FATAL ERROR: Empty Response/Timeout. Check Worker Logs."
    fi
    
    # Print the status clearly.
    echo "[$RESPONSE] for $key"
}

# Export the function and variables so xargs can use them
export -f upload_file
export WORKER_URL

echo "Starting upload to $WORKER_URL with $PARALLEL_JOBS parallel jobs..."

# Find all .md files excluding .obsidian and upload in parallel
find . -type f -name "*.md" ! -path "./.obsidian/*" | \
xargs -P "$PARALLEL_JOBS" -I {} bash -c 'upload_file "{}"'

echo "Upload batch finished."