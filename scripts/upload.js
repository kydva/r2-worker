#!/usr/bin/env node

/**
 * Upload files to R2 bucket
 * Usage: node scripts/upload.js <file-or-directory> [--key <custom-key>] [--verbose]
 */

import { readFileSync, statSync, readdirSync, existsSync } from 'fs';
import { join, relative, basename } from 'path';
import { loadConfig, withRetry, formatBytes, fetchWithTimeout, createProgressBar } from './lib.js';

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const keyIndex = args.indexOf('--key');
const customKey = keyIndex !== -1 ? args[keyIndex + 1] : null;
const source = args.find((arg) => !arg.startsWith('--') && arg !== customKey);

async function main() {
	if (!source) {
		console.error('❌ Usage: node scripts/upload.js <file-or-directory> [--key <custom-key>] [--verbose]');
		process.exit(1);
	}

	if (!existsSync(source)) {
		console.error(`❌ Error: File or directory not found: ${source}`);
		process.exit(1);
	}

	const config = loadConfig();
	if (verbose) config.verbose = true;

	console.log('📤 R2 Upload Tool\n');
	console.log(`Worker URL: ${config.workerUrl}\n`);

	try {
		const files = collectFiles(source);

		console.log(`📊 Found ${files.length} file(s) to upload\n`);

		const progress = createProgressBar(files.length, 'Uploading');
		let successCount = 0;
		let errorCount = 0;
		const errors = [];

		for (const file of files) {
			try {
				const content = readFileSync(file.path);
				const key = customKey && files.length === 1 ? customKey : file.key;
				const encodedKey = encodeURIComponent(key);

				await withRetry(
					async () => {
						const response = await fetchWithTimeout(
							`${config.workerUrl}/${encodedKey}`,
							{
								method: 'PUT',
								body: content,
								headers: {
									'Content-Type': getContentType(file.path),
									'Content-Length': content.length.toString(),
								},
							},
							config.timeout
						);

						if (!response.ok) {
							throw new Error(`HTTP ${response.status}: ${await response.text()}`);
						}
					},
					config.maxRetries,
					config.retryDelay
				);

				successCount++;
				if (verbose) {
					console.log(`\n✅ Uploaded: ${key} (${formatBytes(content.length)})`);
				}
			} catch (error) {
				errorCount++;
				const errorMsg = `${file.key}: ${error.message}`;
				errors.push(errorMsg);
				if (verbose) {
					console.log(`\n❌ Failed: ${errorMsg}`);
				}
			} finally {
				progress.increment();
			}
		}

		console.log('\n📊 Upload Summary:');
		console.log(`  ✅ Successfully uploaded: ${successCount} files`);
		console.log(`  ❌ Failed: ${errorCount} files`);

		if (errors.length > 0) {
			console.log('\n❌ Errors:');
			errors.forEach((error) => console.log(`  - ${error}`));
			process.exit(1);
		}

		console.log('\n🎉 Upload completed successfully!');
	} catch (error) {
		console.error('\n❌ Error:', error.message);
		if (verbose && error.stack) {
			console.error('\nStack trace:', error.stack);
		}
		process.exit(1);
	}
}

function collectFiles(source) {
	const files = [];
	const stat = statSync(source);

	if (stat.isFile()) {
		files.push({
			path: source,
			key: basename(source),
		});
	} else if (stat.isDirectory()) {
		const walk = (dir, baseDir) => {
			const items = readdirSync(dir);
			for (const item of items) {
				const fullPath = join(dir, item);
				const stat = statSync(fullPath);

				if (stat.isFile()) {
					files.push({
						path: fullPath,
						key: relative(baseDir, fullPath),
					});
				} else if (stat.isDirectory()) {
					walk(fullPath, baseDir);
				}
			}
		};
		walk(source, source);
	}

	return files;
}

function getContentType(filename) {
	const ext = filename.split('.').pop()?.toLowerCase();
	const contentTypes = {
		md: 'text/markdown',
		txt: 'text/plain',
		json: 'application/json',
		html: 'text/html',
		css: 'text/css',
		js: 'application/javascript',
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		svg: 'image/svg+xml',
		pdf: 'application/pdf',
		zip: 'application/zip',
	};

	return contentTypes[ext] || 'application/octet-stream';
}

main();
