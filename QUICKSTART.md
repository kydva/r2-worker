# Quick Reference Guide

## 🚀 Common Commands

### Upload Your Vault

```bash
npm run upload
```

### Upload with Custom Settings

```bash
VAULT="/path/to/vault" PARALLEL_JOBS=8 npm run upload
```

### Deploy Worker

```bash
npm run deploy
```

### Run Tests

```bash
npm test              # Unit tests (vitest)
npm run test:manual   # Integration tests
```

### Local Development

```bash
npm run dev           # Start local dev server
```

## 🌐 Web Interface

Open in browser: `https://r2-worker.jija.workers.dev`

**Features:**

- 🔍 Search files by name
- 💾 Download files
- 👁️ View files in browser
- 📊 File statistics

## 📡 API Endpoints

### Upload File

```bash
curl -X PUT --data-binary @"file.md" \
  "https://r2-worker.jija.workers.dev/path/to/file.md"
```

### Download File

```bash
curl "https://r2-worker.jija.workers.dev/path/to/file.md"
```

### List All Files

```bash
curl "https://r2-worker.jija.workers.dev/_list"
```

### Delete File

```bash
curl -X DELETE \
  "https://r2-worker.jija.workers.dev/path/to/file.md"
```

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```bash
VAULT=/Users/lynx/Library/Mobile Documents/iCloud~md~obsidian/Documents/Main vault 2
WORKER_URL=https://r2-worker.jija.workers.dev
PARALLEL_JOBS=4
```

Or export directly:

```bash
export VAULT="/path/to/vault"
export WORKER_URL="https://your-worker.workers.dev"
export PARALLEL_JOBS=4
```

### Wrangler Configuration

Edit `wrangler.jsonc`:

```jsonc
{
	"name": "r2-worker",
	"r2_buckets": [
		{
			"binding": "MY_BUCKET",
			"bucket_name": "your-bucket-name"
		}
	]
}
```

## 🐛 Troubleshooting

### Files show with %XX encoding

✅ Fixed in latest version. Deploy again:

```bash
npm run deploy
```

### Upload script can't find vault

Set the VAULT variable:

```bash
export VAULT="/absolute/path/to/vault"
```

### "Bucket not found" error

Create R2 bucket:

```bash
npx wrangler r2 bucket create your-bucket-name
```

### Slow uploads

Increase parallel jobs:

```bash
PARALLEL_JOBS=8 npm run upload
```

### CORS errors

Deploy latest version (CORS is now enabled):

```bash
npm run deploy
```

## 📊 Upload Output Explained

```
╔════════════════════════════════════════════╗
║   R2 Markdown Sync - Obsidian → R2        ║
╚════════════════════════════════════════════╝

Vault: /path/to/vault                    ← Source directory
Worker: https://...workers.dev           ← Target URL
Parallel jobs: 4                         ← Concurrent uploads

Found 57 markdown files (1.2 MB total)   ← Files discovered

✓ Homepage.md (2.5 KB)                   ← Successfully uploaded
✗ Error.md: Timeout                      ← Failed (if any)
Progress: 4/57 (7%)                      ← Current progress

╔════════════════════════════════════════════╗
║              Upload Summary                ║
╚════════════════════════════════════════════╝

✓ Successful: 57                         ← Success count
✗ Failed: 0                              ← Failure count
Total: 57                                ← Total files
Total size: 1.2 MB                       ← Combined size
Duration: 8s                             ← Time taken
Avg speed: 150 KB/s                      ← Upload speed
```

## 🎨 Console Colors

- 🟢 Green `✓` = Success
- 🔴 Red `✗` = Error
- 🟡 Yellow = Warning/Info
- 🔵 Blue = Progress/Stats
- 🔷 Cyan = Metadata

## 📁 File Structure Reference

```
r2-worker/
├── src/
│   └── index.js           # Cloudflare Worker
├── test/
│   └── index.spec.js      # Unit tests
├── upload.js              # Node.js uploader ⭐
├── test-manual.js         # Integration tests
├── run.sh                 # Legacy bash script
├── package.json           # Dependencies & scripts
├── wrangler.jsonc         # Cloudflare config
├── README.md              # Full documentation
├── TODO.md                # Roadmap
├── SUMMARY.md             # Implementation summary
└── QUICKSTART.md          # This file
```

## ⚡ Performance Tips

1. **Faster uploads:** Increase parallel jobs

   ```bash
   PARALLEL_JOBS=10 npm run upload
   ```

2. **Skip large files:** Modify `upload.js` to check file size

3. **Watch mode:** Use `nodemon` or similar

   ```bash
   npx nodemon --watch "../path/to/vault" --exec "npm run upload"
   ```

4. **Cron job:** Schedule regular syncs
   ```bash
   # Add to crontab: Sync every hour
   0 * * * * cd /path/to/r2-worker && npm run upload
   ```

## 🔐 Security Notes

⚠️ **Current Status:** No authentication (anyone with URL can access)

**For Production:**

1. Add API key authentication
2. Restrict CORS origins
3. Add rate limiting
4. Use environment secrets for sensitive data

## 📚 Related Files

- **Full setup:** See `README.md`
- **Future features:** See `TODO.md`
- **Implementation details:** See `SUMMARY.md`
- **Tests:** See `test/index.spec.js`

## 🆘 Need Help?

1. Check `README.md` for detailed documentation
2. Check `TODO.md` for known issues
3. Run `npm run test:manual` to verify setup
4. Check Cloudflare Workers logs in dashboard

## 🎯 Common Use Cases

### Daily Sync

```bash
#!/bin/bash
# save as sync.sh
cd /path/to/r2-worker
npm run upload
```

### Scheduled Sync (macOS)

Create `~/Library/LaunchAgents/com.user.obsidian-sync.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.user.obsidian-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/sync.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>3600</integer>
</dict>
</plist>
```

### Backup Before Deploy

```bash
# Download all files before deploying changes
mkdir -p backups/$(date +%Y%m%d)
# Use API or web interface to download
```

---

**Happy Syncing! 🚀**
