/**
 * Cloudflare Worker for R2 Storage
 * Provides REST API for R2 bucket operations with enhanced error handling
 */

import { CONFIG, HTTP_STATUS, ERROR_MESSAGES } from './config.js';
import { jsonResponse, errorResponse, successResponse, htmlResponse, validateKey, log, getContentType, isValidMethod } from './utils.js';
import { getHTML } from './html.js';

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;

		// Log request
		log('info', `${method} ${pathname}`);

		try {
			// Handle CORS preflight
			if (method === 'OPTIONS') {
				return handleOptions();
			}

			// Serve frontend HTML for root path
			if (pathname === '/' || pathname === '/index.html' || pathname === '') {
				return handleRoot();
			}

			// API endpoint to list all files
			if (pathname === '/_list') {
				return await handleList(request, env);
			}

			// API endpoint for health check
			if (pathname === '/_health') {
				return handleHealth();
			}

			// Handle file operations (GET, PUT, DELETE)
			const key = decodeURIComponent(pathname.slice(1));
			return await handleFileOperation(method, key, request, env);
		} catch (error) {
			log('error', 'Unhandled error', { error: error.message, stack: error.stack });
			return errorResponse(ERROR_MESSAGES.BUCKET_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
		}
	},
};

/**
 * Handle OPTIONS request for CORS
 */
function handleOptions() {
	return new Response(null, {
		status: HTTP_STATUS.NO_CONTENT,
		headers: {
			'Access-Control-Allow-Origin': CONFIG.cors.allowOrigin,
			'Access-Control-Allow-Methods': CONFIG.cors.allowMethods,
			'Access-Control-Allow-Headers': CONFIG.cors.allowHeaders,
			'Access-Control-Max-Age': CONFIG.cors.maxAge.toString(),
		},
	});
}

/**
 * Handle root path - serve HTML interface
 */
function handleRoot() {
	return htmlResponse(getHTML());
}

/**
 * Handle health check endpoint
 */
function handleHealth() {
	return jsonResponse({
		status: 'healthy',
		version: CONFIG.api.version,
		timestamp: new Date().toISOString(),
	});
}

/**
 * Handle list files endpoint
 */
async function handleList(request, env) {
	if (request.method !== 'GET') {
		return errorResponse(ERROR_MESSAGES.METHOD_NOT_ALLOWED, HTTP_STATUS.METHOD_NOT_ALLOWED);
	}

	try {
		log('info', 'Listing all files from R2 bucket');

		const listed = await env.MY_BUCKET.list({ limit: CONFIG.api.maxListResults });

		const files = listed.objects.map((obj) => ({
			key: obj.key,
			size: obj.size,
			uploaded: obj.uploaded.toISOString(),
			etag: obj.etag,
		}));

		log('info', `Listed ${files.length} files`);

		// Add pagination info if truncated
		const response = {
			files,
			count: files.length,
			truncated: listed.truncated,
		};

		if (listed.truncated && listed.cursor) {
			response.cursor = listed.cursor;
		}

		return jsonResponse(response);
	} catch (error) {
		log('error', 'Failed to list files', { error: error.message });
		return errorResponse(ERROR_MESSAGES.BUCKET_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
	}
}

/**
 * Handle file operations (GET, PUT, DELETE)
 */
async function handleFileOperation(method, key, request, env) {
	// Validate key
	const validation = validateKey(key);
	if (!validation.valid) {
		log('warn', 'Invalid key', { key });
		return errorResponse(validation.error, HTTP_STATUS.BAD_REQUEST);
	}

	const validKey = validation.key;

	switch (method) {
		case 'GET':
			return await handleGet(validKey, env);

		case 'PUT':
			return await handlePut(validKey, request, env);

		case 'DELETE':
			return await handleDelete(validKey, env);

		default:
			return errorResponse(ERROR_MESSAGES.METHOD_NOT_ALLOWED, HTTP_STATUS.METHOD_NOT_ALLOWED);
	}
}

/**
 * Handle GET request - retrieve file from R2
 */
async function handleGet(key, env) {
	try {
		log('info', `Getting file: ${key}`);

		const object = await env.MY_BUCKET.get(key);

		if (!object) {
			log('warn', `File not found: ${key}`);
			return errorResponse(ERROR_MESSAGES.FILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set('etag', object.httpEtag);
		headers.set('Access-Control-Allow-Origin', CONFIG.cors.allowOrigin);

		// Set content type if not already set
		if (!headers.get('Content-Type')) {
			headers.set('Content-Type', getContentType(key));
		}

		// Add content disposition for downloads
		const filename = key.split('/').pop();
		headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);

		log('info', `Successfully retrieved file: ${key} (${object.size} bytes)`);

		return new Response(object.body, {
			status: object.body ? HTTP_STATUS.OK : HTTP_STATUS.PRECONDITION_FAILED,
			headers,
		});
	} catch (error) {
		log('error', `Failed to get file: ${key}`, { error: error.message });
		return errorResponse(ERROR_MESSAGES.BUCKET_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
	}
}

/**
 * Handle PUT request - upload file to R2
 */
async function handlePut(key, request, env) {
	try {
		// Check content length
		const contentLength = request.headers.get('Content-Length');
		if (contentLength && parseInt(contentLength) > CONFIG.api.maxFileSize) {
			log('warn', `File too large: ${key} (${contentLength} bytes)`);
			return errorResponse(ERROR_MESSAGES.FILE_TOO_LARGE, HTTP_STATUS.PAYLOAD_TOO_LARGE);
		}

		log('info', `Uploading file: ${key}`);

		// Get the request body
		const body = await request.arrayBuffer();

		// Additional size check after reading body
		if (body.byteLength > CONFIG.api.maxFileSize) {
			log('warn', `File too large: ${key} (${body.byteLength} bytes)`);
			return errorResponse(ERROR_MESSAGES.FILE_TOO_LARGE, HTTP_STATUS.PAYLOAD_TOO_LARGE);
		}

		// Prepare headers for R2 object
		const httpMetadata = {
			contentType: request.headers.get('Content-Type') || getContentType(key),
		};

		// Upload to R2
		await env.MY_BUCKET.put(key, body, {
			httpMetadata,
		});

		log('info', `Successfully uploaded file: ${key} (${body.byteLength} bytes)`);

		return successResponse(`File uploaded successfully: ${key}`, { key, size: body.byteLength }, HTTP_STATUS.CREATED);
	} catch (error) {
		log('error', `Failed to upload file: ${key}`, { error: error.message });
		return errorResponse(ERROR_MESSAGES.BUCKET_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
	}
}

/**
 * Handle DELETE request - remove file from R2
 */
async function handleDelete(key, env) {
	try {
		log('info', `Deleting file: ${key}`);

		// Check if file exists first
		const object = await env.MY_BUCKET.head(key);

		if (!object) {
			log('warn', `File not found for deletion: ${key}`);
			return errorResponse(ERROR_MESSAGES.FILE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		await env.MY_BUCKET.delete(key);

		log('info', `Successfully deleted file: ${key}`);

		return successResponse(`File deleted successfully: ${key}`, { key });
	} catch (error) {
		log('error', `Failed to delete file: ${key}`, { error: error.message });
		return errorResponse(ERROR_MESSAGES.BUCKET_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
	}
}
