# R2 Markdown Sync

A Cloudflare Workers application for syncing Obsidian markdown files to Cloudflare R2 storage with a beautiful web interface for browsing and downloading your notes.

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Common commands and quick reference
- **[Architecture](ARCHITECTURE.md)** - System design and data flow diagrams
- **[Comparison](COMPARISON.md)** - Before/After improvements
- **[Summary](SUMMARY.md)** - Implementation overview
- **[Changelog](CHANGELOG.md)** - Version history
- **[TODO](TODO.md)** - Roadmap and future features

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Usage](#usage)
  - [Web Interface](#web-interface)
  - [Upload Files (Node.js)](#upload-files-nodejs-script)
  - [Upload Files (Bash)](#upload-files-bash-script---legacy)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Development](#development)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

✨ **Modern Features:**

- 🚀 Fast parallel uploads with Node.js uploader
- 🌐 Beautiful web interface for browsing files
- 🔍 Real-time search and filtering
- 🌍 Full Unicode support (Cyrillic, special characters, etc.)
- 📊 Upload statistics and progress tracking
- 🎨 Responsive design with gradient UI
- ⚡ CORS-enabled API
- 🧪 Comprehensive test suite

## Project Structure

```
r2-worker/
├── src/
│   └── index.js           # Cloudflare Worker (API + Frontend)
├── test/
│   └── index.spec.js      # Comprehensive test suite
├── public/
│   └── index.html         # Standalone frontend (optional)
├── upload.js              # Node.js uploader script
├── run.sh                 # Legacy bash uploader
├── wrangler.jsonc         # Cloudflare configuration
├── vitest.config.js       # Test configuration
└── package.json
```

## Setup

### 1. Prerequisites

- Node.js 18+ installed
- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)

### 2. Configure R2 Bucket

```bash
# Login to Cloudflare
wrangler login

# Create R2 bucket
wrangler r2 bucket create obsidian-vault

# Update wrangler.jsonc with your bucket name
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Deploy Worker

```bash
npm run deploy
```

Your worker will be deployed and accessible at `https://r2-worker.<your-subdomain>.workers.dev`

## Usage

### Web Interface

Visit your worker URL to access the beautiful web interface:

- Browse all uploaded markdown files
- Search files by name
- View file details (size, upload date)
- Download or open files in new tab
- Real-time statistics

### Upload Files (Node.js Script)

The modern, recommended way to upload files:

```bash
# Configure environment variables (optional)
export VAULT="/path/to/your/obsidian/vault"
export WORKER_URL="https://r2-worker.your-subdomain.workers.dev"
export PARALLEL_JOBS=4

# Run upload
npm run upload
```

**Features:**

- Parallel uploads (4 by default, configurable)
- Progress tracking with percentage
- Colored console output
- Error handling and retry logic
- Upload statistics (speed, duration, total size)
- Excludes `.obsidian`, `node_modules`, `.git` folders

**Example Output:**

```
╔════════════════════════════════════════════╗
║   R2 Markdown Sync - Obsidian → R2        ║
╚════════════════════════════════════════════╝

Vault: /Users/lynx/Library/Mobile Documents/iCloud~md~obsidian/Documents/Main vault 2
Worker: https://r2-worker.jija.workers.dev
Parallel jobs: 4

Scanning for markdown files...
Found 57 markdown files (1.2 MB total)

Starting upload...

✓ Homepage.md (2.5 KB)
✓ PROJECT_JIJA/00 - INDEX.md (1.8 KB)
✓ PROJECT_JIJA/02 - Музика/Гітара.md (3.2 KB)
Progress: 4/57 (7%)
...

╔════════════════════════════════════════════╗
║              Upload Summary                ║
╚════════════════════════════════════════════╝

✓ Successful: 57
✗ Failed: 0
Total: 57
Total size: 1.2 MB
Duration: 8s
Avg speed: 150 KB/s
```

### Upload Files (Bash Script - Legacy)

Still available for compatibility:

```bash
./run.sh
```

## API Endpoints

### PUT `/:filepath`

Upload a file to R2.

```bash
curl -X PUT --data-binary @"file.md" \
  "https://your-worker.workers.dev/path/to/file.md"
```

### GET `/:filepath`

Download a file from R2.

```bash
curl "https://your-worker.workers.dev/path/to/file.md"
```

### GET `/_list`

List all files in the bucket.

```bash
curl "https://your-worker.workers.dev/_list"
```

Returns:

```json
[
	{
		"key": "notes/file1.md",
		"size": 1234,
		"uploaded": "2025-10-28T12:00:00.000Z"
	}
]
```

### DELETE `/:filepath`

Delete a file from R2.

```bash
curl -X DELETE "https://your-worker.workers.dev/path/to/file.md"
```

### GET `/` or `/index.html`

Access the web interface.

## Testing

Run the comprehensive test suite:

```bash
npm test
```

**Test Coverage:**

- ✅ Frontend serving
- ✅ URL encoding/decoding (Unicode, Cyrillic, special chars)
- ✅ File upload (single & parallel)
- ✅ File retrieval
- ✅ File listing
- ✅ File deletion
- ✅ CORS support
- ✅ Error handling
- ✅ Complete sync workflow

## Development

### Local Development

```bash
# Start local dev server
npm run dev
```

### Environment Variables

Create a `.env` file for the Node.js uploader:

```env
VAULT=/path/to/your/obsidian/vault
WORKER_URL=https://r2-worker.your-subdomain.workers.dev
PARALLEL_JOBS=4
```

## Configuration

### wrangler.jsonc

```jsonc
{
	"name": "r2-worker",
	"main": "src/index.js",
	"compatibility_date": "2024-01-01",
	"r2_buckets": [
		{
			"binding": "MY_BUCKET",
			"bucket_name": "obsidian-vault"
		}
	]
}
```

## Troubleshooting

### Files show with %XX encoded names

✅ **Fixed!** The worker now properly decodes URL-encoded filenames before storing them in R2. Make sure you've deployed the latest version.

### Upload script can't find vault

Set the `VAULT` environment variable:

```bash
export VAULT="/path/to/your/vault"
npm run upload
```

### CORS errors in browser

The worker includes proper CORS headers. Make sure you've deployed the latest version and cleared your browser cache.

### Tests failing

Ensure you have the latest dependencies:

```bash
npm install
npm test
```

## License

MIT

## Credits

Built with ❤️ using Cloudflare Workers and R2 Storage
