# Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      R2 Markdown Sync System                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   Obsidian Vault     │
│  (Local Storage)     │
│                      │
│  ├── Homepage.md     │
│  ├── PROJECT_JIJA/   │
│  │   ├── 00-INDEX.md │
│  │   ├── 01-Внєшка/ │
│  │   └── 02-Музика/ │
│  └── ...             │
└──────────┬───────────┘
           │
           │ npm run upload
           │ (Node.js Script)
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers (Edge)                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  r2-worker.jija.workers.dev                                │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │   Router    │  │     API      │  │    Frontend     │  │  │
│  │  │             │  │              │  │                 │  │  │
│  │  │  /          │→ │  Serve HTML  │  │  ┌───────────┐ │  │  │
│  │  │  /:file     │→ │  GET/PUT/DEL │  │  │  Browser  │ │  │  │
│  │  │  /_list     │→ │  List files  │  │  │  Search   │ │  │  │
│  │  │  OPTIONS    │→ │  CORS        │  │  │  Download │ │  │  │
│  │  └─────────────┘  └──────┬───────┘  └─────────────────┘  │  │
│  │                           │                                │  │
│  └───────────────────────────┼────────────────────────────────┘  │
└────────────────────────────────┼───────────────────────────────────┘
                                 │
                                 │ R2 Binding (MY_BUCKET)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Cloudflare R2 Storage                        │
│                                                                  │
│  Bucket: "jija"                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Files (Properly Named):                                    │ │
│  │                                                            │ │
│  │  ✓ Homepage.md                                            │ │
│  │  ✓ PROJECT_JIJA/00 - INDEX.md                            │ │
│  │  ✓ PROJECT_JIJA/01 - Внєшка/Одяг.md                      │ │
│  │  ✓ PROJECT_JIJA/02 - Музика/Гітара.md                    │ │
│  │  ✓ PROJECT_JIJA/04 - Менталка/Дофамін.md                 │ │
│  │  ✓ Habits/Ходить 10.000 шагов.md                         │ │
│  │  ... (57 files total)                                     │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Properties:                                                     │
│  • No egress fees (free downloads!)                              │
│  • CDN-backed (fast global access)                               │
│  • Unlimited storage (pay per GB)                                │
│  • Automatic backups                                             │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│   Web Browser       │
│                     │
│  https://r2-worker  │
│    .jija.workers    │
│         .dev        │
│                     │
│  ┌───────────────┐  │
│  │ 📚 Browser    │  │
│  │ 🔍 Search     │  │
│  │ 💾 Download   │  │
│  │ 👁️  View      │  │
│  └───────────────┘  │
└─────────────────────┘
```

## Data Flow

### Upload Flow

```
1. User: npm run upload
   ↓
2. upload.js scans vault directory
   ↓
3. Finds all .md files (excludes .obsidian, etc.)
   ↓
4. For each file (in parallel):
   • Read file content
   • Encode filename (URL safe)
   • PUT to worker
   ↓
5. Worker receives request:
   • Decode filename (restore original)
   • Store in R2 with original name
   • Return success/error
   ↓
6. upload.js shows progress:
   ✓ File uploaded (size)
   Progress: X/Y (N%)
   ↓
7. Show final statistics:
   • Success/failed count
   • Total size
   • Duration
   • Average speed
```

### Download Flow (Web UI)

```
1. User opens: https://r2-worker.jija.workers.dev
   ↓
2. Worker serves embedded HTML frontend
   ↓
3. Frontend JavaScript:
   • Fetch /_list endpoint
   • Parse JSON response
   • Render file list
   ↓
4. User interactions:
   • Search: Filter files locally
   • Download: Create <a> link with file URL
   • View: Open file in new tab
   ↓
5. File download:
   • Browser: GET /:filepath
   • Worker: Fetch from R2
   • Worker: Return file content
   • Browser: Download file
```

## Component Details

### 1. Node.js Uploader (`upload.js`)

```javascript
Responsibilities:
• Scan vault directory recursively
• Find all .md files
• Exclude system directories
• Upload files in parallel
• Track progress and statistics
• Handle errors gracefully

Tech Stack:
• Node.js fs/promises
• Native fetch API
• URL encoding/decoding
```

### 2. Cloudflare Worker (`src/index.js`)

```javascript
Responsibilities:
• Route requests (PUT/GET/DELETE/OPTIONS)
• Decode URL-encoded filenames
• Interact with R2 storage
• Serve embedded frontend
• Handle CORS
• List files endpoint

Tech Stack:
• Cloudflare Workers runtime
• R2 bindings
• Web Standards API
```

### 3. Web Frontend (Embedded in Worker)

```javascript
Responsibilities:
• Display file list
• Search/filter files
• Show statistics
• Handle downloads
• Beautiful UI

Tech Stack:
• Vanilla JavaScript
• CSS (no frameworks)
• Fetch API
```

### 4. R2 Storage

```javascript
Responsibilities:
• Store markdown files
• Maintain metadata (size, upload date)
• Serve files globally via CDN
• Handle large files efficiently

Features:
• S3-compatible API
• No egress fees
• Automatic replication
• High durability
```

## Network Flow

```
                           Internet
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        │                     │                     │
   Node.js                 Browser              Browser
   Uploader               (Desktop)            (Mobile)
        │                     │                     │
        │ HTTPS PUT          │ HTTPS GET           │ HTTPS GET
        │ /file.md           │ /                   │ /_list
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    Cloudflare Edge Network
                    (180+ locations worldwide)
                              │
                              ▼
                      Cloudflare Workers
                      • Execute at edge
                      • < 50ms CPU time
                      • Global deployment
                              │
                              ▼
                         R2 Storage
                      • S3-compatible
                      • Multi-region
                      • Automatic backups
```

## Security Model

```
┌──────────────────────────────────────────────────────────────┐
│                      Security Layers                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layer 1: Transport Security                           │ │
│  │  • HTTPS/TLS 1.3                                       │ │
│  │  • Certificate managed by Cloudflare                   │ │
│  │  • Automatic renewal                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layer 2: CORS Policy                                  │ │
│  │  • Access-Control-Allow-Origin: *                      │ │
│  │  • OPTIONS preflight support                           │ │
│  │  ⚠️  Currently open (OK for personal use)              │ │
│  │  🔒 TODO: Restrict in production                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layer 3: Authentication (TODO)                        │ │
│  │  • ❌ Not implemented yet                              │ │
│  │  • 🔜 API key authentication planned                   │ │
│  │  • 🔜 Rate limiting planned                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layer 4: R2 Bucket Security                           │ │
│  │  • Private by default                                  │ │
│  │  • Only worker has access                              │ │
│  │  • Binding via environment variables                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

### Upload Performance

```
File Count: 57 files
Total Size: 1.2 MB
Parallel Jobs: 4
Duration: ~8 seconds
Average Speed: ~150 KB/s

Bottlenecks:
• Network latency (RTT to Cloudflare)
• Local disk read speed
• Cloudflare worker cold starts (first request)

Optimizations:
• Increase parallel jobs (PARALLEL_JOBS=8)
• Use faster internet connection
• Worker stays warm with regular use
```

### Download Performance

```
File Size: 3.2 KB (typical)
Time to First Byte: < 50ms (CDN cache hit)
Download Time: < 100ms (total)

Features:
• Global CDN distribution
• Automatic caching
• No egress fees
• HTTP/2 & HTTP/3 support
```

### Worker Performance

```
Cold Start: ~10-50ms
Warm Execution: < 5ms
CPU Time Limit: 50ms (plenty for our use)
Memory: 128MB available

Operations:
• PUT: ~5-10ms (R2 write)
• GET: ~2-5ms (R2 read)
• LIST: ~10-20ms (R2 list)
• HTML: < 1ms (inline)
```

## Scalability

```
Current Setup:
• Single worker deployment
• Single R2 bucket
• No rate limiting
• Suitable for: Personal use (1-10 users)

Scales to:
• 100s of files: ✓ No issues
• 1000s of files: ✓ Works well
• 10,000s of files: ⚠️  List operation may slow down
• 100,000s of files: ❌ Need pagination

Future improvements:
• Pagination for file list
• Caching layer
• Multiple workers per region
• Rate limiting
• Database for metadata
```

## Cost Analysis

```
Cloudflare Workers:
• 100,000 requests/day: FREE
• After: $0.50 per million requests

Cloudflare R2:
• Storage: $0.015 per GB/month
• No egress fees (downloads are FREE!)
• Class A operations (write): $4.50 per million
• Class B operations (read): $0.36 per million

Example Monthly Cost:
• 1.2 MB storage: ~$0.00002/month
• 1,000 uploads: ~$0.0045
• 10,000 downloads: FREE
• Total: ~$0.005/month ≈ FREE! 🎉

Compare to:
• AWS S3: ~$0.023/GB for storage + egress fees
• Google Cloud Storage: Similar pricing + egress
• R2 is 10x cheaper with no egress fees!
```

## Technology Stack Summary

```
┌───────────────────────────────────────────────────┐
│                 Technology Stack                  │
├───────────────────────────────────────────────────┤
│ Frontend:                                         │
│ • Vanilla JavaScript (ES6+)                       │
│ • HTML5 & CSS3                                    │
│ • Fetch API                                       │
│ • No frameworks (lightweight!)                    │
├───────────────────────────────────────────────────┤
│ Backend:                                          │
│ • Cloudflare Workers (V8 isolates)                │
│ • Web Standards APIs                              │
│ • Cloudflare R2 (S3-compatible)                   │
├───────────────────────────────────────────────────┤
│ CLI/Scripts:                                      │
│ • Node.js 18+                                     │
│ • Native modules (fs, path, fetch)                │
│ • No external dependencies                        │
├───────────────────────────────────────────────────┤
│ Development:                                      │
│ • Wrangler CLI                                    │
│ • Vitest (testing)                                │
│ • Git (version control)                           │
├───────────────────────────────────────────────────┤
│ Infrastructure:                                   │
│ • Cloudflare Edge Network (180+ locations)        │
│ • R2 Multi-region storage                         │
│ • Automatic HTTPS                                 │
│ • DDoS protection (included)                      │
└───────────────────────────────────────────────────┘
```

---

**Architecture designed for:**

- ⚡ Speed (edge computing)
- 💰 Low cost (pay-as-you-go)
- 🌍 Global reach (CDN)
- 🔒 Security (HTTPS + R2 isolation)
- 📈 Scalability (serverless)
- 🛠️ Maintainability (simple stack)
