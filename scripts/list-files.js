#!/usr/bin/env node

/**
 * List all files in R2 bucket
 * Usage: node scripts/list-files.js [--json] [--verbose]
 */

import { loadConfig, withRetry, formatBytes, formatDate, fetchWithTimeout } from './lib.js';

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const verbose = args.includes('--verbose');

async function main() {
	const config = loadConfig();
	if (verbose) config.verbose = true;

	try {
		if (!jsonOutput) {
			console.log('📋 Fetching file list...\n');
		}

		const response = await withRetry(
			() => fetchWithTimeout(`${config.workerUrl}/_list`, {}, config.timeout),
			config.maxRetries,
			config.retryDelay
		);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		const files = data.files || data || [];

		if (jsonOutput) {
			console.log(JSON.stringify(files, null, 2));
			return;
		}

		console.log(`📊 Total files: ${files.length}`);

		if (files.length === 0) {
			console.log('✅ No files in bucket.');
			return;
		}

		const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
		console.log(`💾 Total size: ${formatBytes(totalSize)}\n`);

		// Group by extension
		const byExtension = files.reduce((acc, file) => {
			const ext = file.key.split('.').pop()?.toLowerCase() || 'no-extension';
			acc[ext] = (acc[ext] || 0) + 1;
			return acc;
		}, {});

		console.log('📁 Files by extension:');
		Object.entries(byExtension)
			.sort((a, b) => b[1] - a[1])
			.forEach(([ext, count]) => {
				console.log(`  .${ext}: ${count} files`);
			});

		console.log('\n📄 Files:');
		files.forEach((file, i) => {
			console.log(`  ${i + 1}. ${file.key}`);
			if (verbose) {
				console.log(`     Size: ${formatBytes(file.size)}`);
				console.log(`     Uploaded: ${formatDate(file.uploaded)}`);
				if (file.etag) console.log(`     ETag: ${file.etag}`);
			} else {
				console.log(`     ${formatBytes(file.size)} • ${formatDate(file.uploaded)}`);
			}
		});
	} catch (error) {
		if (jsonOutput) {
			console.error(JSON.stringify({ error: error.message }));
		} else {
			console.error('❌ Error:', error.message);
		}
		process.exit(1);
	}
}

main();
