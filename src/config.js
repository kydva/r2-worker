/**
 * Configuration for the R2 Worker
 */

export const CONFIG = {
	// API Configuration
	api: {
		version: '1.0.0',
		maxFileSize: 100 * 1024 * 1024, // 100MB
		maxListResults: 10000,
	},

	// CORS Configuration
	cors: {
		allowOrigin: '*', // Change to specific domains in production
		allowMethods: 'GET, PUT, DELETE, OPTIONS',
		allowHeaders: 'Content-Type, Content-Length',
		maxAge: 86400, // 24 hours
	},

	// Cache Configuration
	cache: {
		htmlMaxAge: 3600, // 1 hour
		staticMaxAge: 86400, // 24 hours
	},

	// Rate Limiting (informational - implement with Cloudflare Workers if needed)
	rateLimit: {
		requestsPerMinute: 60,
		enabled: false, // Enable with Cloudflare Rate Limiting
	},

	// Logging
	logging: {
		enabled: true,
		verbosity: 'info', // debug, info, warn, error
	},
};

export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_ALLOWED: 405,
	PAYLOAD_TOO_LARGE: 413,
	PRECONDITION_FAILED: 412,
	INTERNAL_SERVER_ERROR: 500,
	SERVICE_UNAVAILABLE: 503,
};

export const ERROR_MESSAGES = {
	INVALID_KEY: 'Invalid file key',
	FILE_NOT_FOUND: 'File not found',
	FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
	BUCKET_ERROR: 'R2 bucket operation failed',
	INVALID_REQUEST: 'Invalid request',
	METHOD_NOT_ALLOWED: 'Method not allowed',
};
