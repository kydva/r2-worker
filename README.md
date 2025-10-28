# R2 Worker - Production-Ready R2 Storage API# R2 Markdown Sync

A robust, production-ready Cloudflare Worker for R2 storage management with comprehensive error handling, CORS support, and a built-in web UI.A Cloudflare Workers application for syncing Obsidian markdown files to Cloudflare R2 storage with a beautiful web interface for browsing and downloading your notes.

## Features## 📚 Documentation

- ✅ **RESTful API** - Full CRUD operations (GET, PUT, DELETE, LIST)- **[Quick Start Guide](QUICKSTART.md)** - Common commands and quick reference

- ✅ **Error Handling** - Comprehensive validation and error responses- **[Architecture](ARCHITECTURE.md)** - System design and data flow diagrams

- ✅ **CORS Support** - Cross-origin requests enabled- **[Comparison](COMPARISON.md)** - Before/After improvements

- ✅ **Web UI** - Built-in file browser interface- **[Summary](SUMMARY.md)** - Implementation overview

- ✅ **Health Checks** - `/_health` endpoint for monitoring- **[Changelog](CHANGELOG.md)** - Version history

- ✅ **Logging** - Structured logging with configurable verbosity- **[TODO](TODO.md)** - Roadmap and future features

- ✅ **Security** - Path traversal protection, file size limits

- ✅ **Management Scripts** - CLI tools for backup, upload, list, and delete operations## Table of Contents

## Quick Start- [Features](#features)

- [Project Structure](#project-structure)

### Prerequisites- [Setup](#setup)

- [Usage](#usage)

- Node.js 18+ and npm - [Web Interface](#web-interface)

- Cloudflare account - [Upload Files (Node.js)](#upload-files-nodejs-script)

- Wrangler CLI (installed via npm) - [Upload Files (Bash)](#upload-files-bash-script---legacy)

- [API Endpoints](#api-endpoints)

### Installation- [Testing](#testing)

- [Development](#development)

````bash- [Configuration](#configuration)

# Clone or download the project- [Troubleshooting](#troubleshooting)

cd r2-worker- [License](#license)



# Install dependencies## Features

npm install

✨ **Modern Features:**

# Configure wrangler.jsonc with your R2 bucket details

```- 🚀 Fast parallel uploads with Node.js uploader

- 🌐 Beautiful web interface for browsing files

### Development- 🔍 Real-time search and filtering

- 🌍 Full Unicode support (Cyrillic, special characters, etc.)

```bash- 📊 Upload statistics and progress tracking

# Start local development server- 🎨 Responsive design with gradient UI

npm run dev- ⚡ CORS-enabled API

- 🧪 Comprehensive test suite

# The worker will be available at http://localhost:8787

```## Project Structure



### Deployment```

r2-worker/

```bash├── src/

# Deploy to production│   └── index.js           # Cloudflare Worker (API + Frontend)

npm run deploy├── test/

│   └── index.spec.js      # Comprehensive test suite

# Deploy to staging├── public/

npm run deploy:staging│   └── index.html         # Standalone frontend (optional)

├── upload.js              # Node.js uploader script

# Check deployment status├── run.sh                 # Legacy bash uploader

npm run status├── wrangler.jsonc         # Cloudflare configuration

├── vitest.config.js       # Test configuration

# View live logs└── package.json

npm run logs```

````

## Setup

## API Endpoints

### 1. Prerequisites

### Web UI

- `GET /` - Interactive file browser interface- Node.js 18+ installed

- Cloudflare account

### Health Check- Wrangler CLI installed (`npm install -g wrangler`)

- `GET /_health` - Returns worker health status and version

### 2. Configure R2 Bucket

### List Files

`bash`bash

GET /\_list# Login to Cloudflare

wrangler login

Response:

{# Create R2 bucket

"files": [wrangler r2 bucket create obsidian-vault

    {

      "key": "example.md",# Update wrangler.jsonc with your bucket name

      "size": 1234,```

      "uploaded": "2025-10-28T12:00:00.000Z",

      "etag": "abc123"### 3. Install Dependencies

    }

],```bash

"count": 1,npm install

"truncated": false```

}

````### 4. Deploy Worker



### Get File```bash

```bashnpm run deploy

GET /{filename}```



# ExampleYour worker will be deployed and accessible at `https://r2-worker.<your-subdomain>.workers.dev`

curl https://r2-worker.jija.workers.dev/example.md

```## Usage



### Upload File### Web Interface

```bash

PUT /{filename}Visit your worker URL to access the beautiful web interface:

Content-Type: text/markdown

- Browse all uploaded markdown files

# Example- Search files by name

curl -X PUT --data-binary "@file.md" \- View file details (size, upload date)

  -H "Content-Type: text/markdown" \- Download or open files in new tab

  https://r2-worker.jija.workers.dev/file.md- Real-time statistics

````

### Upload Files (Node.js Script)

### Delete File

````bashThe modern, recommended way to upload files:

DELETE /{filename}

```bash

# Example# Configure environment variables (optional)

curl -X DELETE https://r2-worker.jija.workers.dev/file.mdexport VAULT="/path/to/your/obsidian/vault"

```export WORKER_URL="https://r2-worker.your-subdomain.workers.dev"

export PARALLEL_JOBS=4

## Management Scripts

# Run upload

All scripts are located in the `scripts/` directory and support `--verbose` flag for detailed output.npm run upload

````

### List Files

````bash**Features:**

# List all files

npm run list- Parallel uploads (4 by default, configurable)

- Progress tracking with percentage

# Output as JSON- Colored console output

npm run list:json- Error handling and retry logic

- Upload statistics (speed, duration, total size)

# With verbose logging- Excludes `.obsidian`, `node_modules`, `.git` folders

node scripts/list-files.js --verbose

```**Example Output:**



### Upload Files```

```bash╔════════════════════════════════════════════╗

# Upload a single file║   R2 Markdown Sync - Obsidian → R2        ║

npm run upload -- path/to/file.md╚════════════════════════════════════════════╝



# Upload with custom keyVault: /Users/lynx/Library/Mobile Documents/iCloud~md~obsidian/Documents/Main vault 2

node scripts/upload.js file.md --key custom/path/file.mdWorker: https://r2-worker.jija.workers.dev

Parallel jobs: 4

# Upload entire directory

npm run upload -- path/to/directoryScanning for markdown files...

```Found 57 markdown files (1.2 MB total)



### Backup All FilesStarting upload...

```bash

# Backup to default location (./backup)✓ Homepage.md (2.5 KB)

npm run backup✓ PROJECT_JIJA/00 - INDEX.md (1.8 KB)

✓ PROJECT_JIJA/02 - Музика/Гітара.md (3.2 KB)

# Backup to custom directoryProgress: 4/57 (7%)

node scripts/backup.js --output /path/to/backup...



# Creates a manifest.json with metadata╔════════════════════════════════════════════╗

```║              Upload Summary                ║

╚════════════════════════════════════════════╝

### Delete All Files

```bash✓ Successful: 57

# Delete all files (with confirmation)✗ Failed: 0

npm run delete-allTotal: 57

Total size: 1.2 MB

# Force delete without confirmationDuration: 8s

node scripts/delete-all.js --forceAvg speed: 150 KB/s

````

# Verbose output

node scripts/delete-all.js --verbose### Upload Files (Bash Script - Legacy)

````

Still available for compatibility:

## Configuration

```bash

### Worker Configuration (`src/index.js`)./run.sh

````

````javascript

const CONFIG = {## API Endpoints

  api: {

    version: '1.0.0',### PUT `/:filepath`

    maxFileSize: 100 * 1024 * 1024, // 100MB

    maxListResults: 10000,Upload a file to R2.

  },

  cors: {```bash

    allowOrigin: '*', // Change for productioncurl -X PUT --data-binary @"file.md" \

    allowMethods: 'GET, PUT, DELETE, OPTIONS',  "https://your-worker.workers.dev/path/to/file.md"

    allowHeaders: 'Content-Type, Content-Length',```

    maxAge: 86400,

  },### GET `/:filepath`

  logging: {

    enabled: true,Download a file from R2.

    verbosity: 'info', // debug, info, warn, error

  },```bash

};curl "https://your-worker.workers.dev/path/to/file.md"

````

### Script Configuration (`config.json`)### GET `/_list`

```````jsonList all files in the bucket.

{

  "workerUrl": "https://r2-worker.jija.workers.dev",```bash

  "workerName": "r2-worker",curl "https://your-worker.workers.dev/_list"

  "bucketName": "jija",```

  "maxRetries": 3,

  "retryDelay": 1000,Returns:

  "timeout": 30000,

  "batchSize": 10,```json

  "verbose": false[

}	{

```		"key": "notes/file1.md",

		"size": 1234,

You can also use environment variables:		"uploaded": "2025-10-28T12:00:00.000Z"

```bash	}

export WORKER_URL="https://your-worker.workers.dev"]

export BUCKET_NAME="your-bucket"```

export VERBOSE="true"

```### DELETE `/:filepath`



## Project StructureDelete a file from R2.



``````bash

r2-worker/curl -X DELETE "https://your-worker.workers.dev/path/to/file.md"

├── src/```

│   ├── index.js          # Main worker code (production-ready)

│   ├── config.js         # Configuration constants### GET `/` or `/index.html`

│   ├── utils.js          # Utility functions

│   ├── html.js           # HTML template loaderAccess the web interface.

│   └── frontend.html     # Web UI template

├── scripts/## Testing

│   ├── lib.js            # Shared script utilities

│   ├── list-files.js     # List all filesRun the comprehensive test suite:

│   ├── upload.js         # Upload files

│   ├── backup.js         # Backup all files```bash

│   ├── delete-all.js     # Delete all filesnpm test

│   └── deploy.sh         # Deployment script```

├── test/

│   └── index.spec.js     # Test files**Test Coverage:**

├── config.json           # Script configuration

├── wrangler.jsonc        # Cloudflare configuration- ✅ Frontend serving

└── package.json          # Project dependencies- ✅ URL encoding/decoding (Unicode, Cyrillic, special chars)

```- ✅ File upload (single & parallel)

- ✅ File retrieval

## Error Handling- ✅ File listing

- ✅ File deletion

The API returns standardized error responses:- ✅ CORS support

- ✅ Error handling

```json- ✅ Complete sync workflow

{

  "error": "Error message",## Development

  "status": 404,

  "timestamp": "2025-10-28T12:00:00.000Z"### Local Development

}

``````bash

# Start local dev server

HTTP Status Codes:npm run dev

- `200` - Success```

- `201` - Created

- `204` - No Content### Environment Variables

- `400` - Bad Request (invalid key)

- `404` - Not FoundCreate a `.env` file for the Node.js uploader:

- `405` - Method Not Allowed

- `413` - Payload Too Large```env

- `500` - Internal Server ErrorVAULT=/path/to/your/obsidian/vault

WORKER_URL=https://r2-worker.your-subdomain.workers.dev

## Security FeaturesPARALLEL_JOBS=4

```````

- **Path Traversal Protection** - Prevents `..` in file paths

- **File Size Limits** - Configurable maximum file size (default 100MB)## Configuration

- **Input Validation** - All file keys are validated

- **CORS Headers** - Properly configured cross-origin headers### wrangler.jsonc

- **Content Type Detection** - Automatic content type assignment

````jsonc

## Logging{

	"name": "r2-worker",

Logs are available through Wrangler:	"main": "src/index.js",

	"compatibility_date": "2024-01-01",

```bash	"r2_buckets": [

# View live logs		{

npm run logs			"binding": "MY_BUCKET",

			"bucket_name": "obsidian-vault"

# Or directly		}

npx wrangler tail	]

```}

````

Log format:

```## Troubleshooting

[2025-10-28T12:00:00.000Z] [INFO] GET /example.md

[2025-10-28T12:00:00.100Z] [INFO] Retrieved: example.md (1234 bytes)### Files show with %XX encoded names

```

✅ **Fixed!** The worker now properly decodes URL-encoded filenames before storing them in R2. Make sure you've deployed the latest version.

## Testing

### Upload script can't find vault

````bash

# Run testsSet the `VAULT` environment variable:

npm test

```bash

# Run tests in watch modeexport VAULT="/path/to/your/vault"

npm run test -- --watchnpm run upload

````

## Troubleshooting### CORS errors in browser

### Files not appearing in listThe worker includes proper CORS headers. Make sure you've deployed the latest version and cleared your browser cache.

- Check that files were uploaded successfully

- Verify R2 bucket binding in `wrangler.jsonc`### Tests failing

- Check browser console for errors

Ensure you have the latest dependencies:

### Upload failures

- Verify file size is under limit (default 100MB)```bash

- Check Content-Type header is setnpm install

- Ensure proper authenticationnpm test

````

### Script errors

- Verify `config.json` has correct worker URL## License

- Check network connectivity

- Run with `--verbose` flag for detailed outputMIT



## Best Practices## Credits



1. **Production CORS** - Update `allowOrigin` to specific domains in productionBuilt with ❤️ using Cloudflare Workers and R2 Storage

2. **File Size Limits** - Adjust `maxFileSize` based on your needs
3. **Monitoring** - Use `/_health` endpoint for uptime monitoring
4. **Backups** - Schedule regular backups using `npm run backup`
5. **Logging** - Monitor logs with `npm run logs`
6. **Testing** - Always run tests before deployment

## Available NPM Scripts

```json
{
  "deploy": "Deploy to production",
  "deploy:staging": "Deploy to staging environment",
  "dev": "Start local development server",
  "start": "Alias for dev",
  "test": "Run tests",
  "upload": "Upload files to R2",
  "list": "List all files",
  "list:json": "List files as JSON",
  "backup": "Backup all files",
  "delete-all": "Delete all files (with confirmation)",
  "logs": "View live worker logs",
  "status": "Check deployment status"
}
````

## License

MIT

## Support

For issues and questions:

- Check existing documentation in the `docs/` directory
- Review error logs with `npm run logs`
- Use `--verbose` flag on scripts for debugging
- Check the `ARCHITECTURE.md` for technical details
