# R2 Markdown Sync - TODO & Implementation Checklist

## ✅ Completed

### Core Functionality

- [x] Fix URL encoding issue in worker (decodeURIComponent)
- [x] Handle Unicode/Cyrillic filenames correctly
- [x] Implement file upload (PUT)
- [x] Implement file download (GET)
- [x] Implement file deletion (DELETE)
- [x] Implement file listing (GET /\_list)
- [x] Add CORS support (OPTIONS, headers)
- [x] Serve web frontend from root path

### Node.js Uploader

- [x] Replace bash script with Node.js implementation
- [x] Parallel upload support (configurable workers)
- [x] Progress tracking and statistics
- [x] Colored console output
- [x] Error handling and reporting
- [x] Recursive directory scanning
- [x] Exclude system directories (.obsidian, node_modules, .git)
- [x] Upload summary with speed and duration
- [x] Environment variable configuration

### Web Frontend

- [x] Beautiful gradient UI design
- [x] File listing with real-time search
- [x] File statistics (count, total size, filtered)
- [x] Download file functionality
- [x] View file in new tab functionality
- [x] Responsive design
- [x] Loading states and error handling
- [x] Empty state handling

### Testing

- [x] Frontend serving tests
- [x] URL encoding/decoding tests (Unicode, Cyrillic, special chars)
- [x] File upload tests (single & parallel)
- [x] File retrieval tests
- [x] File listing tests
- [x] File deletion tests
- [x] CORS tests
- [x] Error handling tests
- [x] Complete sync workflow test
- [x] Manual integration test script

### Documentation

- [x] Comprehensive README with setup instructions
- [x] API endpoint documentation
- [x] Usage examples for uploader
- [x] Configuration guide
- [x] Troubleshooting section
- [x] Feature list

## 🔄 In Progress / Testing

- [ ] Verify all tests pass in CI/CD environment
- [ ] Test with real Obsidian vault (in progress)
- [ ] Performance testing with large vaults (1000+ files)

## 🎯 Future Enhancements

### Priority 1 - Core Features

- [ ] **Incremental sync**: Only upload changed files
  - Track file hashes/timestamps locally
  - Compare with R2 stored metadata
  - Skip unchanged files
- [ ] **Bi-directional sync**: Download files from R2
  - Download all files command
  - Download specific files/folders
  - Conflict resolution strategy
- [ ] **Delete sync**: Remove files from R2 that were deleted locally
  - Track deleted files
  - Optionally preserve files in R2 (backup mode)

### Priority 2 - User Experience

- [ ] **Progress UI improvements**
  - Real-time upload progress bar
  - Individual file progress
  - Retry failed uploads
- [ ] **Frontend enhancements**
  - Folder tree view
  - File preview (render markdown)
  - Bulk download (zip)
  - Upload from web interface
  - Dark mode toggle
- [ ] **CLI improvements**
  - Interactive mode
  - Watch mode (auto-sync on file changes)
  - Configuration file (.r2syncrc)
  - Multiple vault profiles

### Priority 3 - Advanced Features

- [ ] **Authentication**
  - API key authentication
  - OAuth integration
  - Read-only public links
- [ ] **File versioning**
  - Keep multiple versions in R2
  - Version history in frontend
  - Restore previous versions
- [ ] **Search improvements**
  - Full-text search in file contents
  - Tag-based filtering
  - Date range filtering
- [ ] **Collaboration**
  - Share individual files/folders
  - Comment system
  - Activity log

### Priority 4 - DevOps & Performance

- [ ] **Caching**
  - Client-side caching with service worker
  - CDN caching headers
  - ETag validation
- [ ] **Monitoring**
  - Upload/download metrics
  - Error tracking
  - Usage statistics dashboard
- [ ] **Backup & Recovery**
  - Automatic backups to separate bucket
  - Export all files as zip
  - Import from zip
- [ ] **Performance optimizations**
  - Compression before upload
  - Chunked uploads for large files
  - Resume interrupted uploads
  - Batch operations API

### Priority 5 - Integration

- [ ] **Obsidian plugin**
  - Native Obsidian integration
  - Sync on save
  - Sync settings UI
- [ ] **Mobile apps**
  - React Native app
  - Offline mode
  - Background sync
- [ ] **Desktop app**
  - Electron wrapper
  - System tray integration
  - Auto-start on boot
- [ ] **Third-party integrations**
  - GitHub Actions workflow
  - Telegram bot for notifications
  - Discord webhook integration
  - Notion import/export

## 🐛 Known Issues

### To Fix

- [x] Filenames with %XX encoding in bash script
- [ ] Vitest integration tests failing (need to investigate worker pool config)
- [ ] Large file uploads (>100MB) may timeout
- [ ] No progress indication for individual files in parallel upload

### To Investigate

- [ ] Memory usage with very large vaults (10,000+ files)
- [ ] Rate limiting on Cloudflare Workers
- [ ] R2 bucket size limits

## 📝 Notes

### Architecture Decisions

- **Why Node.js uploader over bash?**
  - Better cross-platform support
  - More reliable error handling
  - Easier to extend with features
  - Better Unicode handling
- **Why embed frontend in worker?**
  - Single deployment (no separate hosting)
  - Automatic HTTPS
  - No CORS issues
  - Faster initial load

### Performance Considerations

- Parallel uploads default to 4 workers (good balance for most connections)
- Can be increased for faster connections (up to 10-15)
- R2 has no egress fees (great for downloads)
- Worker has 50ms CPU limit per request (should be fine for most operations)

### Security Considerations

- Currently no authentication (anyone with URL can access)
- Should add API key authentication for production use
- CORS is wide open (\* for all origins) - OK for personal use, should restrict for teams
- Consider adding rate limiting to prevent abuse

## 🚀 Release Checklist

### v1.0.0 (Current)

- [x] Core upload/download functionality
- [x] Web interface
- [x] Basic tests
- [x] Documentation

### v1.1.0 (Next Minor Release)

- [ ] Incremental sync
- [ ] File versioning
- [ ] Authentication
- [ ] All tests passing

### v2.0.0 (Major Release)

- [ ] Bi-directional sync
- [ ] Obsidian plugin
- [ ] Full-text search
- [ ] Mobile apps
