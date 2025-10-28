/**
 * Utility functions for the R2 Worker
 */

import { CONFIG, HTTP_STATUS, ERROR_MESSAGES } from './config.js';

/**
 * Create a standardized JSON response
 */
export function jsonResponse(data, status = HTTP_STATUS.OK, headers = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...addCorsHeaders(headers),
		},
	});
}

/**
 * Create a standardized error response
 */
export function errorResponse(message, status = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) {
	const error = {
		error: message,
		status,
		timestamp: new Date().toISOString(),
	};

	if (details && CONFIG.logging.verbosity === 'debug') {
		error.details = details;
	}

	return jsonResponse(error, status);
}

/**
 * Create a success response
 */
export function successResponse(message, data = null, status = HTTP_STATUS.OK) {
	const response = {
		success: true,
		message,
		timestamp: new Date().toISOString(),
	};

	if (data) {
		response.data = data;
	}

	return jsonResponse(response, status);
}

/**
 * Add CORS headers to response headers
 */
export function addCorsHeaders(headers = {}) {
	return {
		...headers,
		'Access-Control-Allow-Origin': CONFIG.cors.allowOrigin,
		'Access-Control-Allow-Methods': CONFIG.cors.allowMethods,
		'Access-Control-Allow-Headers': CONFIG.cors.allowHeaders,
		'Access-Control-Max-Age': CONFIG.cors.maxAge.toString(),
	};
}

/**
 * Validate file key
 */
export function validateKey(key) {
	if (!key || typeof key !== 'string') {
		return { valid: false, error: ERROR_MESSAGES.INVALID_KEY };
	}

	// Remove potentially dangerous characters
	const cleaned = key.trim();

	if (cleaned.length === 0) {
		return { valid: false, error: ERROR_MESSAGES.INVALID_KEY };
	}

	// Check for path traversal attempts
	if (cleaned.includes('..') || cleaned.startsWith('/')) {
		return { valid: false, error: ERROR_MESSAGES.INVALID_KEY };
	}

	return { valid: true, key: cleaned };
}

/**
 * Log information (can be extended to use Cloudflare Logpush)
 */
export function log(level, message, data = null) {
	if (!CONFIG.logging.enabled) return;

	const levels = { debug: 0, info: 1, warn: 2, error: 3 };
	const configLevel = levels[CONFIG.logging.verbosity] || 1;
	const messageLevel = levels[level] || 1;

	if (messageLevel >= configLevel) {
		const timestamp = new Date().toISOString();
		const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

		if (data) {
			console.log(logMessage, data);
		} else {
			console.log(logMessage);
		}
	}
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Sanitize filename for display
 */
export function sanitizeFilename(filename) {
	return filename.replace(/[<>:"/\\|?*]/g, '_');
}

/**
 * Get content type from filename
 */
export function getContentType(filename) {
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

/**
 * Check if request has valid method
 */
export function isValidMethod(method, allowedMethods) {
	return allowedMethods.includes(method);
}

/**
 * Create HTML response with proper headers
 */
export function htmlResponse(html, status = HTTP_STATUS.OK) {
	return new Response(html, {
		status,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': `public, max-age=${CONFIG.cache.htmlMaxAge}`,
			...addCorsHeaders(),
		},
	});
}
