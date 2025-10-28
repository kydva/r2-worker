#!/usr/bin/env node

// Simple test script to verify R2 worker functionality

const WORKER_URL = process.env.WORKER_URL || 'https://r2-worker.jija.workers.dev';

const colors = {
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	reset: '\x1b[0m',
};

async function test(name, fn) {
	try {
		await fn();
		console.log(`${colors.green}✓${colors.reset} ${name}`);
		return true;
	} catch (error) {
		console.log(`${colors.red}✗${colors.reset} ${name}`);
		console.log(`  ${colors.red}${error.message}${colors.reset}`);
		return false;
	}
}

async function main() {
	console.log(`${colors.blue}Testing R2 Worker at ${WORKER_URL}${colors.reset}\n`);

	let passed = 0;
	let failed = 0;

	// Test 1: Upload a file with Unicode characters
	if (
		await test('Upload file with Cyrillic characters', async () => {
			const key = 'Test/Тестовий файл.md';
			const content = '# Тестовий документ\n\nЦе тест з кирилицею';
			const encodedKey = encodeURIComponent(key);

			const response = await fetch(`${WORKER_URL}/${encodedKey}`, {
				method: 'PUT',
				body: content,
			});

			if (!response.ok) {
				throw new Error(`Upload failed: ${response.status}`);
			}

			const result = await response.text();
			if (!result.includes(key)) {
				throw new Error(`Response doesn't contain decoded filename: ${result}`);
			}
		})
	)
		passed++;
	else failed++;

	// Test 2: Retrieve the uploaded file
	if (
		await test('Retrieve uploaded file', async () => {
			const key = 'Test/Тестовий файл.md';
			const encodedKey = encodeURIComponent(key);

			const response = await fetch(`${WORKER_URL}/${encodedKey}`);

			if (!response.ok) {
				throw new Error(`Retrieve failed: ${response.status}`);
			}

			const content = await response.text();
			if (!content.includes('кирилицею')) {
				throw new Error(`Content doesn't match: ${content}`);
			}
		})
	)
		passed++;
	else failed++;

	// Test 3: List files
	if (
		await test('List all files', async () => {
			const response = await fetch(`${WORKER_URL}/_list`);

			if (!response.ok) {
				throw new Error(`List failed: ${response.status}`);
			}

			const files = await response.json();
			if (!Array.isArray(files)) {
				throw new Error('Response is not an array');
			}

			// Should find our test file
			const testFile = files.find((f) => f.key === 'Test/Тестовий файл.md');
			if (!testFile) {
				throw new Error('Test file not found in list');
			}
		})
	)
		passed++;
	else failed++;

	// Test 4: Access frontend
	if (
		await test('Access web frontend', async () => {
			const response = await fetch(WORKER_URL);

			if (!response.ok) {
				throw new Error(`Frontend failed: ${response.status}`);
			}

			const html = await response.text();
			if (!html.includes('R2 Markdown Browser')) {
				throw new Error('Frontend HTML not found');
			}
		})
	)
		passed++;
	else failed++;

	// Test 5: Delete file
	if (
		await test('Delete uploaded file', async () => {
			const key = 'Test/Тестовий файл.md';
			const encodedKey = encodeURIComponent(key);

			const response = await fetch(`${WORKER_URL}/${encodedKey}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`Delete failed: ${response.status}`);
			}
		})
	)
		passed++;
	else failed++;

	// Test 6: Verify deletion
	if (
		await test('Verify file was deleted', async () => {
			const key = 'Test/Тестовий файл.md';
			const encodedKey = encodeURIComponent(key);

			const response = await fetch(`${WORKER_URL}/${encodedKey}`);

			if (response.status !== 404) {
				throw new Error(`File still exists: ${response.status}`);
			}
		})
	)
		passed++;
	else failed++;

	console.log(`\n${colors.blue}Results:${colors.reset}`);
	console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
	console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

	if (failed > 0) {
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
	process.exit(1);
});
