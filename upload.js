#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

// Configuration
const VAULT = process.env.VAULT || '/Users/lynx/Library/Mobile Documents/iCloud~md~obsidian/Documents/Main vault 2';
const WORKER_URL = process.env.WORKER_URL || 'https://r2-worker.jija.workers.dev';
const PARALLEL_JOBS = parseInt(process.env.PARALLEL_JOBS || '4', 10);
const EXCLUDE_DIRS = ['.obsidian', 'node_modules', '.git'];

// Colors for console output
const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
};

// Statistics
const stats = {
	total: 0,
	success: 0,
	failed: 0,
	skipped: 0,
	totalSize: 0,
	startTime: Date.now(),
};

/**
 * Recursively find all .md files in a directory
 */
async function findMarkdownFiles(dir, baseDir = dir) {
	const files = [];

	try {
		const entries = await readdir(dir);

		for (const entry of entries) {
			const fullPath = path.join(dir, entry);
			const fileStat = await stat(fullPath);

			if (fileStat.isDirectory()) {
				if (!EXCLUDE_DIRS.includes(entry)) {
					const subFiles = await findMarkdownFiles(fullPath, baseDir);
					files.push(...subFiles);
				}
			} else if (fileStat.isFile() && entry.endsWith('.md')) {
				const relativePath = path.relative(baseDir, fullPath);
				files.push({
					fullPath,
					relativePath,
					size: fileStat.size,
				});
				stats.totalSize += fileStat.size;
			}
		}
	} catch (error) {
		console.error(`${colors.red}Error reading directory ${dir}: ${error.message}${colors.reset}`);
	}

	return files;
}

/**
 * Upload a single file to R2
 */
async function uploadFile(file) {
	const { fullPath, relativePath, size } = file;
	const encodedPath = encodeURIComponent(relativePath);
	const url = `${WORKER_URL}/${encodedPath}`;

	try {
		const content = await readFile(fullPath);

		const response = await fetch(url, {
			method: 'PUT',
			body: content,
			headers: {
				'Content-Type': 'text/markdown',
			},
			signal: AbortSignal.timeout(60000), // 60 second timeout
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`HTTP ${response.status}: ${errorText}`);
		}

		const result = await response.text();
		stats.success++;

		console.log(`${colors.green}✓${colors.reset} ${relativePath} ${colors.cyan}(${formatBytes(size)})${colors.reset}`);
		return { success: true, file: relativePath };
	} catch (error) {
		stats.failed++;
		console.error(`${colors.red}✗${colors.reset} ${relativePath}: ${error.message}`);
		return { success: false, file: relativePath, error: error.message };
	}
}

/**
 * Upload files in parallel batches
 */
async function uploadBatch(files) {
	const results = [];

	for (let i = 0; i < files.length; i += PARALLEL_JOBS) {
		const batch = files.slice(i, i + PARALLEL_JOBS);
		const batchResults = await Promise.all(batch.map(uploadFile));
		results.push(...batchResults);

		// Show progress
		const progress = Math.min(i + PARALLEL_JOBS, files.length);
		console.log(`${colors.blue}Progress: ${progress}/${files.length} (${Math.round((progress / files.length) * 100)}%)${colors.reset}`);
	}

	return results;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration to human-readable string
 */
function formatDuration(ms) {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	if (minutes > 0) {
		return `${minutes}m ${remainingSeconds}s`;
	}
	return `${seconds}s`;
}

/**
 * Main function
 */
async function main() {
	console.log(`${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
	console.log(`${colors.cyan}║   R2 Markdown Sync - Obsidian → R2        ║${colors.reset}`);
	console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

	console.log(`${colors.blue}Vault:${colors.reset} ${VAULT}`);
	console.log(`${colors.blue}Worker:${colors.reset} ${WORKER_URL}`);
	console.log(`${colors.blue}Parallel jobs:${colors.reset} ${PARALLEL_JOBS}\n`);

	// Check if vault exists
	if (!fs.existsSync(VAULT)) {
		console.error(`${colors.red}Error: Vault directory does not exist: ${VAULT}${colors.reset}`);
		process.exit(1);
	}

	// Find all markdown files
	console.log(`${colors.yellow}Scanning for markdown files...${colors.reset}`);
	const files = await findMarkdownFiles(VAULT);
	stats.total = files.length;

	if (files.length === 0) {
		console.log(`${colors.yellow}No markdown files found.${colors.reset}`);
		return;
	}

	console.log(`${colors.green}Found ${files.length} markdown files (${formatBytes(stats.totalSize)} total)${colors.reset}\n`);

	// Upload files
	console.log(`${colors.yellow}Starting upload...${colors.reset}\n`);
	await uploadBatch(files);

	// Print summary
	const duration = Date.now() - stats.startTime;
	const avgSpeed = stats.totalSize / (duration / 1000);

	console.log(`\n${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
	console.log(`${colors.cyan}║              Upload Summary                ║${colors.reset}`);
	console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);
	console.log(`${colors.green}✓ Successful:${colors.reset} ${stats.success}`);
	console.log(`${colors.red}✗ Failed:${colors.reset} ${stats.failed}`);
	console.log(`${colors.blue}Total:${colors.reset} ${stats.total}`);
	console.log(`${colors.blue}Total size:${colors.reset} ${formatBytes(stats.totalSize)}`);
	console.log(`${colors.blue}Duration:${colors.reset} ${formatDuration(duration)}`);
	console.log(`${colors.blue}Avg speed:${colors.reset} ${formatBytes(avgSpeed)}/s\n`);

	if (stats.failed > 0) {
		process.exit(1);
	}
}

// Run
main().catch((error) => {
	console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
	console.error(error.stack);
	process.exit(1);
});
