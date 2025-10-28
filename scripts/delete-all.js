#!/usr/bin/env node

/**
 * Delete all files from R2 bucket
 * Usage: node scripts/delete-all.js [--force] [--verbose]
 */

import { loadConfig, withRetry, formatBytes, createProgressBar, fetchWithTimeout, batchProcess } from './lib.js';

const args = process.argv.slice(2);
const force = args.includes('--force');
const verbose = args.includes('--verbose');

async function main() {
	const config = loadConfig();
	if (verbose) config.verbose = true;

	console.log('🔍 R2 Bucket Cleanup Tool\n');
	console.log(`Worker URL: ${config.workerUrl}`);
	console.log(`Bucket: ${config.bucketName}\n`);

	try {
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
			console.log('✅ No files to delete. Bucket is already empty.');
			return;
		}

		// Calculate total size
		const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
		console.log(`💾 Total size: ${formatBytes(totalSize)}\n`);

		// Show sample files
		console.log('Sample files:');
		files.slice(0, 10).forEach((file, i) => {
			console.log(`  ${i + 1}. ${file.key} (${formatBytes(file.size)})`);
		});

		if (files.length > 10) {
			console.log(`  ... and ${files.length - 10} more files`);
		}

		// Confirm deletion
		if (!force) {
			console.log('\n⚠️  WARNING: This will DELETE ALL FILES from the bucket!');
			console.log('This action cannot be undone.\n');

			const readline = await import('readline');
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});

			const answer = await new Promise((resolve) => {
				rl.question('Type "DELETE" to confirm: ', resolve);
			});
			rl.close();

			if (answer.trim() !== 'DELETE') {
				console.log('\n❌ Aborted. No files were deleted.');
				return;
			}
		}

		console.log('\n🗑️  Deleting files...\n');

		// Delete files with progress bar
		const progress = createProgressBar(files.length, 'Deleting');
		let successCount = 0;
		let errorCount = 0;
		const errors = [];

		const deleteFile = async (file) => {
			try {
				const encodedKey = encodeURIComponent(file.key);
				const deleteResponse = await withRetry(
					() =>
						fetchWithTimeout(
							`${config.workerUrl}/${encodedKey}`,
							{
								method: 'DELETE',
							},
							config.timeout
						),
					config.maxRetries,
					config.retryDelay
				);

				if (!deleteResponse.ok) {
					throw new Error(`HTTP ${deleteResponse.status}`);
				}

				successCount++;
				if (verbose) {
					console.log(`✅ Deleted: ${file.key}`);
				}
				return { success: true, key: file.key };
			} catch (error) {
				errorCount++;
				const errorMsg = `${file.key}: ${error.message}`;
				errors.push(errorMsg);
				if (verbose) {
					console.log(`❌ Failed: ${errorMsg}`);
				}
				return { success: false, key: file.key, error: error.message };
			} finally {
				progress.increment();
			}
		};

		// Process files in batches
		await batchProcess(files, config.batchSize, deleteFile);

		// Summary
		console.log('\n📊 Deletion Summary:');
		console.log(`  ✅ Successfully deleted: ${successCount} files`);
		console.log(`  ❌ Failed: ${errorCount} files`);
		console.log(`  📁 Total processed: ${files.length} files\n`);

		if (errors.length > 0) {
			console.log('❌ Errors encountered:');
			errors.slice(0, 10).forEach((error) => console.log(`  - ${error}`));
			if (errors.length > 10) {
				console.log(`  ... and ${errors.length - 10} more errors`);
			}
			process.exit(1);
		}

		console.log('🎉 All files deleted successfully!');
	} catch (error) {
		console.error('\n❌ Error:', error.message);
		if (verbose && error.stack) {
			console.error('\nStack trace:', error.stack);
		}
		process.exit(1);
	}
}

main();
