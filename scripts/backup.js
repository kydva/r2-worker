#!/usr/bin/env node

/**
 * Backup all files from R2 bucket
 * Usage: node scripts/backup.js [--output <directory>] [--verbose]
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { loadConfig, withRetry, formatBytes, createProgressBar, fetchWithTimeout, batchProcess } from './lib.js';

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const outputIndex = args.indexOf('--output');
const outputDir = outputIndex !== -1 ? args[outputIndex + 1] : join(process.cwd(), 'backup');

async function main() {
	const config = loadConfig();
	if (verbose) config.verbose = true;

	console.log('💾 R2 Backup Tool\n');
	console.log(`Worker URL: ${config.workerUrl}`);
	console.log(`Output directory: ${outputDir}\n`);

	try {
		// Create output directory
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true });
			console.log(`📁 Created backup directory: ${outputDir}\n`);
		}

		// Fetch file list
		console.log('📋 Fetching file list...');
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

		console.log(`📊 Found ${files.length} files\n`);

		if (files.length === 0) {
			console.log('✅ No files to backup.');
			return;
		}

		const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
		console.log(`💾 Total size: ${formatBytes(totalSize)}\n`);

		console.log('⬇️  Downloading files...\n');

		const progress = createProgressBar(files.length, 'Backing up');
		let successCount = 0;
		let errorCount = 0;
		const errors = [];

		const downloadFile = async (file) => {
			try {
				const encodedKey = encodeURIComponent(file.key);
				const downloadResponse = await withRetry(
					() => fetchWithTimeout(`${config.workerUrl}/${encodedKey}`, {}, config.timeout),
					config.maxRetries,
					config.retryDelay
				);

				if (!downloadResponse.ok) {
					throw new Error(`HTTP ${downloadResponse.status}`);
				}

				const content = await downloadResponse.arrayBuffer();
				const filePath = join(outputDir, file.key);

				// Create parent directories if needed
				const fileDir = dirname(filePath);
				if (!existsSync(fileDir)) {
					mkdirSync(fileDir, { recursive: true });
				}

				writeFileSync(filePath, Buffer.from(content));

				successCount++;
				if (verbose) {
					console.log(`\n✅ Downloaded: ${file.key} (${formatBytes(content.byteLength)})`);
				}
				return { success: true, key: file.key };
			} catch (error) {
				errorCount++;
				const errorMsg = `${file.key}: ${error.message}`;
				errors.push(errorMsg);
				if (verbose) {
					console.log(`\n❌ Failed: ${errorMsg}`);
				}
				return { success: false, key: file.key, error: error.message };
			} finally {
				progress.increment();
			}
		};

		// Process files in batches
		await batchProcess(files, config.batchSize, downloadFile);

		// Create manifest file
		const manifest = {
			timestamp: new Date().toISOString(),
			source: config.workerUrl,
			totalFiles: files.length,
			totalSize: totalSize,
			successful: successCount,
			failed: errorCount,
			files: files.map((f) => ({
				key: f.key,
				size: f.size,
				uploaded: f.uploaded,
			})),
		};

		writeFileSync(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

		// Summary
		console.log('\n📊 Backup Summary:');
		console.log(`  ✅ Successfully backed up: ${successCount} files`);
		console.log(`  ❌ Failed: ${errorCount} files`);
		console.log(`  📁 Location: ${outputDir}\n`);

		if (errors.length > 0) {
			console.log('❌ Errors encountered:');
			errors.slice(0, 10).forEach((error) => console.log(`  - ${error}`));
			if (errors.length > 10) {
				console.log(`  ... and ${errors.length - 10} more errors`);
			}
			process.exit(1);
		}

		console.log('🎉 Backup completed successfully!');
	} catch (error) {
		console.error('\n❌ Error:', error.message);
		if (verbose && error.stack) {
			console.error('\nStack trace:', error.stack);
		}
		process.exit(1);
	}
}

main();
