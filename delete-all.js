/**
 * Script to delete all files from the R2 bucket
 * Usage: node delete-all.js
 */

const WORKER_URL = 'https://r2-worker.jija.workers.dev'; // Deployed worker URL

async function deleteAllFiles() {
	console.log('🔍 Fetching list of all files...');

	try {
		// Get list of all files
		const response = await fetch(`${WORKER_URL}/_list`);
		if (!response.ok) {
			throw new Error(`Failed to fetch file list: ${response.status} ${response.statusText}`);
		}

		const files = await response.json();
		console.log(`📊 Found ${files.length} files to delete`);

		if (files.length === 0) {
			console.log('✅ No files to delete. Bucket is already empty.');
			return;
		}

		// Confirm deletion
		console.log('\n⚠️  WARNING: This will delete ALL files from the R2 bucket!');
		console.log('Files to be deleted:');
		files.forEach((file, index) => {
			console.log(`  ${index + 1}. ${file.key} (${formatBytes(file.size)})`);
		});

		console.log('\n🗑️  Starting deletion...\n');

		// Delete each file
		let successCount = 0;
		let errorCount = 0;

		for (const file of files) {
			try {
				const encodedKey = encodeURIComponent(file.key);
				const deleteResponse = await fetch(`${WORKER_URL}/${encodedKey}`, {
					method: 'DELETE',
				});

				if (deleteResponse.ok) {
					console.log(`✅ Deleted: ${file.key}`);
					successCount++;
				} else {
					console.log(`❌ Failed to delete: ${file.key} (${deleteResponse.status})`);
					errorCount++;
				}
			} catch (error) {
				console.log(`❌ Error deleting ${file.key}: ${error.message}`);
				errorCount++;
			}
		}

		console.log('\n📊 Deletion Summary:');
		console.log(`  ✅ Successfully deleted: ${successCount} files`);
		console.log(`  ❌ Failed: ${errorCount} files`);
		console.log(`  📁 Total processed: ${files.length} files`);

		if (successCount === files.length) {
			console.log('\n🎉 All files deleted successfully!');
		}
	} catch (error) {
		console.error('❌ Error:', error.message);
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
