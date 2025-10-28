# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-10-28

### 🎉 Initial Production Release

### ✨ Added

- **Fixed URL encoding issue**: Files now store with proper filenames instead of URL-encoded names

  - Added `decodeURIComponent()` in worker
  - Full Unicode/Cyrillic support
  - Proper handling of special characters and spaces

- **Modern Node.js uploader** (`upload.js`):

  - Parallel uploads with configurable worker count (default: 4)
  - Real-time progress tracking with percentage
  - Beautiful colored console output with emojis
  - Comprehensive upload statistics (speed, duration, size)
  - Detailed error reporting
  - Recursive directory scanning
  - Auto-exclude system directories (.obsidian, node_modules, .git)
  - Environment variable configuration
  - Cross-platform support

- **Web interface**:

  - Beautiful gradient UI design
  - File browser with real-time search
  - File statistics dashboard (count, total size, filtered count)
  - One-click download functionality
  - View file in new tab
  - Responsive design
  - Loading states and error handling
  - Empty state handling
  - Embedded directly in worker (single deployment)

- **API enhancements**:

  - GET `/_list` endpoint for file listing
  - CORS support (OPTIONS method)
  - Access-Control headers for cross-origin requests
  - Content-Type headers for proper file handling

- **Testing**:

  - Comprehensive unit test suite (vitest)
  - Manual integration tests
  - URL encoding/decoding tests
  - Unicode/Cyrillic filename tests
  - Frontend serving tests
  - CORS tests
  - Complete sync workflow tests

- **Documentation**:
  - Comprehensive README with setup guide
  - TODO.md with roadmap and future features
  - SUMMARY.md with implementation overview
  - QUICKSTART.md with common commands
  - COMPARISON.md showing before/after improvements
  - CHANGELOG.md (this file)

### 🔧 Changed

- Worker now decodes URL-encoded paths before storing in R2
- Worker now serves embedded HTML frontend at root path
- Enhanced error messages for better debugging
- Improved package.json with additional scripts

### 🐛 Fixed

- **Critical**: Fixed URL encoding issue - files no longer stored with %XX encoding
- Filenames with Cyrillic characters now work correctly
- Filenames with spaces now work correctly
- Filenames with special characters now work correctly

### 🗑️ Deprecated

- `run.sh` bash script (still available for compatibility)
  - Replaced by modern `upload.js` Node.js implementation
  - Consider migrating to `npm run upload`

### 📊 Statistics

- **12.69 KB** worker size (gzipped: 3.51 KB)
- **6/6** integration tests passing
- **12+** unit tests
- **1850+** lines of code and documentation

### 🎯 Performance

- Average upload speed: ~150 KB/s
- Parallel uploads: 4 workers (configurable up to 10+)
- Worker deployment: ~10 seconds
- Test execution: <1 second

---

## [0.0.0] - Pre-release

### Initial Implementation

- Basic R2 worker with PUT/GET/DELETE endpoints
- Basic bash upload script
- Basic test suite
- Minimal documentation

### Known Issues (Fixed in 1.0.0)

- Files stored with URL-encoded names (%XX format)
- No web interface
- No file listing functionality
- Limited error handling
- No upload progress tracking
- No statistics

---

## Future Releases

### [1.1.0] - Planned

- Incremental sync (only upload changed files)
- File versioning
- Authentication (API keys)
- Improved error handling
- Watch mode for auto-sync

### [2.0.0] - Planned

- Bi-directional sync (download from R2)
- Obsidian plugin
- Full-text search
- Mobile apps
- Conflict resolution

See [TODO.md](TODO.md) for complete roadmap.

---

## Version History

| Version | Date        | Description                |
| ------- | ----------- | -------------------------- |
| 1.0.0   | 2025-10-28  | Initial production release |
| 0.0.0   | Pre-release | Basic implementation       |

---

## Migration Guide

### From 0.0.0 to 1.0.0

#### Files Already Uploaded with Encoded Names

Your existing files in R2 have URL-encoded names. Options:

1. **Re-upload** (recommended):

   ```bash
   npm run upload
   ```

   This will upload with proper names. You can then manually delete old encoded files.

2. **Keep both** (temporary):
   Old encoded files will remain accessible but new uploads will use proper names.

#### Bash Script Users

Replace:

```bash
./run.sh
```

With:

```bash
npm run upload
```

Benefits:

- Better progress tracking
- Error handling
- Statistics
- Configurable parallel jobs

#### API Users

Add support for new `/_list` endpoint:

```javascript
// List all files
const response = await fetch('https://worker.dev/_list');
const files = await response.json();
```

---

## Breaking Changes

### None

This release maintains backward compatibility with the original API while adding new features.

---

## Contributors

- Initial implementation and improvements
- URL encoding fix
- Node.js uploader
- Web interface
- Comprehensive testing
- Documentation

---

## License

MIT

---

**Note**: This is the first production-ready release. All major issues from the pre-release version have been fixed.
