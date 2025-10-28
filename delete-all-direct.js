/**
 * Script to delete all files from R2 bucket using Wrangler R2 API
 * This script uses child_process to execute wrangler commands
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const BUCKET_NAME = 'jija';

async function deleteAllFiles() {
	console.log('🔍 Fetching list of all files from R2 bucket...');

	try {
		// List all objects in the bucket
		const { stdout: listOutput } = await execAsync(`npx wrangler r2 object list ${BUCKET_NAME} --json`, {
			cwd: '/Users/lynx/cf/r2-worker',
		});

		const result = JSON.parse(listOutput);
		const objects = result.objects || [];

		console.log(`📊 Found ${objects.length} files to delete`);

		if (objects.length === 0) {
			console.log('✅ No files to delete. Bucket is already empty.');
			return;
		}

		console.log('\n⚠️  WARNING: This will delete ALL files from the R2 bucket!');
		console.log('Files to be deleted:');
		objects.forEach((obj, index) => {
			console.log(`  ${index + 1}. ${obj.key} (${formatBytes(obj.size)})`);
		});

		console.log('\n🗑️  Starting deletion...\n');

		// Delete each file
		let successCount = 0;
		let errorCount = 0;

		for (const obj of objects) {
			try {
				await execAsync(`npx wrangler r2 object delete ${BUCKET_NAME}/${obj.key}`, { cwd: '/Users/lynx/cf/r2-worker' });
				console.log(`✅ Deleted: ${obj.key}`);
				successCount++;
			} catch (error) {
				console.log(`❌ Failed to delete: ${obj.key}`);
				console.error(`   Error: ${error.message}`);
				errorCount++;
			}
		}

		console.log('\n📊 Deletion Summary:');
		console.log(`  ✅ Successfully deleted: ${successCount} files`);
		console.log(`  ❌ Failed: ${errorCount} files`);
		console.log(`  📁 Total processed: ${objects.length} files`);

		if (successCount === objects.length) {
			console.log('\n🎉 All files deleted successfully!');
		}
	} catch (error) {
		console.error('❌ Error:', error.message);
		if (error.stderr) {
			console.error('Details:', error.stderr);
		}
		process.exit(1);
	}
}

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the deletion
deleteAllFiles();
