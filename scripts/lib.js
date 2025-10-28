#!/usr/bin/env node

/**
 * Configuration management for R2 Worker scripts
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default configuration
const defaultConfig = {
	workerUrl: 'https://r2-worker.jija.workers.dev',
	workerName: 'r2-worker',
	bucketName: 'jija',
	maxRetries: 3,
	retryDelay: 1000, // ms
	timeout: 30000, // ms
	batchSize: 10, // for concurrent operations
	verbose: false,
};

/**
 * Load configuration from file or environment
 */
export function loadConfig() {
	const config = { ...defaultConfig };

	// Try to load from .env or config file
	const configPath = join(__dirname, '..', 'config.json');
	if (existsSync(configPath)) {
		try {
			const fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
			Object.assign(config, fileConfig);
		} catch (error) {
			console.warn(`Warning: Could not parse config.json: ${error.message}`);
		}
	}

	// Override with environment variables
	if (process.env.WORKER_URL) config.workerUrl = process.env.WORKER_URL;
	if (process.env.WORKER_NAME) config.workerName = process.env.WORKER_NAME;
	if (process.env.BUCKET_NAME) config.bucketName = process.env.BUCKET_NAME;
	if (process.env.VERBOSE === 'true') config.verbose = true;

	return config;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
	let lastError;

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			if (i < maxRetries - 1) {
				const delay = baseDelay * Math.pow(2, i);
				console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
				await sleep(delay);
			}
		}
	}

	throw lastError;
}

/**
 * Sleep utility
 */
export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format date to readable string
 */
export function formatDate(date) {
	return new Date(date).toLocaleString();
}

/**
 * Create a progress bar
 */
export function createProgressBar(total, label = 'Progress') {
	let current = 0;

	return {
		increment() {
			current++;
			this.render();
		},
		render() {
			const percent = Math.floor((current / total) * 100);
			const filled = Math.floor(percent / 2);
			const empty = 50 - filled;
			const bar = '█'.repeat(filled) + '░'.repeat(empty);
			process.stdout.write(`\r${label}: ${bar} ${percent}% (${current}/${total})`);
			if (current === total) {
				process.stdout.write('\n');
			}
		},
	};
}

/**
 * Make HTTP request with timeout
 */
export async function fetchWithTimeout(url, options = {}, timeout = 30000) {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		});
		clearTimeout(id);
		return response;
	} catch (error) {
		clearTimeout(id);
		throw error;
	}
}

/**
 * Validate worker URL
 */
export function validateWorkerUrl(url) {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Batch process items
 */
export async function batchProcess(items, batchSize, processor) {
	const results = [];

	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		const batchResults = await Promise.allSettled(batch.map(processor));
		results.push(...batchResults);
	}

	return results;
}
