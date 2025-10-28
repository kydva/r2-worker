import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../src';

describe('R2 File Synchronization Worker', () => {
	const testKey = 'test-folder/test-file.md';
	const testContent = '# Test Document\n\nThis is a test markdown file.';

	beforeEach(async () => {
		// Clean up test files before each test
		await env.MY_BUCKET.delete(testKey);
	});

	describe('Frontend serving', () => {
		it('serves HTML frontend at root path', async () => {
			const response = await SELF.fetch('http://example.com/');
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('text/html');
			const html = await response.text();
			expect(html).toContain('R2 Markdown Browser');
			expect(html).toContain('Browse your Obsidian vault');
		});

		it('serves HTML frontend at /index.html', async () => {
			const response = await SELF.fetch('http://example.com/index.html');
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('text/html');
		});
	});

	describe('URL encoding/decoding', () => {
		it('handles Cyrillic characters in filenames', async () => {
			const cyrillicKey = 'Менталка/Дофамін.md';
			const cyrillicContent = '# Дофамін\n\nТестовий вміст';

			// Upload with encoded URL
			const encodedKey = encodeURIComponent(cyrillicKey);
			const putResponse = await SELF.fetch(`http://example.com/${encodedKey}`, {
				method: 'PUT',
				body: cyrillicContent,
			});
			expect(putResponse.status).toBe(200);
			const putBody = await putResponse.text();
			expect(putBody).toBe(`Put ${cyrillicKey} successfully!`);

			// Verify it's stored with original (decoded) key
			const storedObject = await env.MY_BUCKET.get(cyrillicKey);
			expect(storedObject).not.toBeNull();
			const storedText = await storedObject.text();
			expect(storedText).toBe(cyrillicContent);

			// Cleanup
			await env.MY_BUCKET.delete(cyrillicKey);
		});

		it('handles spaces in filenames', async () => {
			const key = 'My Notes/Daily Note.md';
			const content = '# Daily Note';

			const encodedKey = encodeURIComponent(key);
			const putResponse = await SELF.fetch(`http://example.com/${encodedKey}`, {
				method: 'PUT',
				body: content,
			});
			expect(putResponse.status).toBe(200);

			const storedObject = await env.MY_BUCKET.get(key);
			expect(storedObject).not.toBeNull();

			await env.MY_BUCKET.delete(key);
		});

		it('handles special characters in filenames', async () => {
			const key = 'Notes/Test (2024).md';
			const content = '# Test';

			const encodedKey = encodeURIComponent(key);
			const putResponse = await SELF.fetch(`http://example.com/${encodedKey}`, {
				method: 'PUT',
				body: content,
			});
			expect(putResponse.status).toBe(200);

			const storedObject = await env.MY_BUCKET.get(key);
			expect(storedObject).not.toBeNull();

			await env.MY_BUCKET.delete(key);
		});
	});

	describe('PUT - Upload files', () => {
		it('uploads a file successfully (unit style)', async () => {
			const request = new Request(`http://example.com/${testKey}`, {
				method: 'PUT',
				body: testContent,
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);

			expect(response.status).toBe(200);
			const body = await response.text();
			expect(body).toBe(`Put ${testKey} successfully!`);
		});

		it('uploads a file successfully (integration style)', async () => {
			const response = await SELF.fetch(`http://example.com/${testKey}`, {
				method: 'PUT',
				body: testContent,
			});

			expect(response.status).toBe(200);
			const body = await response.text();
			expect(body).toBe(`Put ${testKey} successfully!`);
		});

		it('uploads and persists file content', async () => {
			// Upload file
			const putResponse = await SELF.fetch(`http://example.com/${testKey}`, {
				method: 'PUT',
				body: testContent,
			});
			expect(putResponse.status).toBe(200);
			await putResponse.text(); // Consume body

			// Verify it was stored in R2
			const storedObject = await env.MY_BUCKET.get(testKey);
			expect(storedObject).not.toBeNull();
			const storedText = await storedObject.text();
			expect(storedText).toBe(testContent);
		});

		it('handles multiple file uploads in parallel', async () => {
			const files = [
				{ key: 'file1.md', content: '# File 1' },
				{ key: 'file2.md', content: '# File 2' },
				{ key: 'file3.md', content: '# File 3' },
			];

			const uploadPromises = files.map(({ key, content }) =>
				SELF.fetch(`http://example.com/${key}`, {
					method: 'PUT',
					body: content,
				})
			);

			const responses = await Promise.all(uploadPromises);

			for (const response of responses) {
				expect(response.status).toBe(200);
				await response.text(); // Consume body
			}

			// Verify all files were stored
			for (const { key, content } of files) {
				const storedObject = await env.MY_BUCKET.get(key);
				expect(storedObject).not.toBeNull();
				const storedText = await storedObject.text();
				expect(storedText).toBe(content);
				await env.MY_BUCKET.delete(key); // cleanup
			}
		});
	});

	describe('GET - Retrieve files', () => {
		it('retrieves an uploaded file successfully', async () => {
			// First upload a file
			await env.MY_BUCKET.put(testKey, testContent);

			// Then retrieve it
			const response = await SELF.fetch(`http://example.com/${testKey}`);

			expect(response.status).toBe(200);
			const body = await response.text();
			expect(body).toBe(testContent);
		});

		it('returns 404 for non-existent files', async () => {
			const response = await SELF.fetch('http://example.com/non-existent-file.md');

			expect(response.status).toBe(404);
			const body = await response.text();
			expect(body).toBe('Object Not Found');
		});

		it('includes proper HTTP metadata in response', async () => {
			await env.MY_BUCKET.put(testKey, testContent);

			const response = await SELF.fetch(`http://example.com/${testKey}`);
			await response.text(); // Consume the body completely

			expect(response.status).toBe(200);
			expect(response.headers.has('etag')).toBe(true);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});
	});

	describe('LIST - File listing', () => {
		it('lists all files in the bucket', async () => {
			// Upload some test files
			const testFiles = [
				{ key: 'notes/file1.md', content: '# File 1' },
				{ key: 'notes/file2.md', content: '# File 2' },
				{ key: 'docs/file3.md', content: '# File 3' },
			];

			for (const { key, content } of testFiles) {
				await env.MY_BUCKET.put(key, content);
			}

			// Get the list
			const response = await SELF.fetch('http://example.com/_list');
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('application/json');

			const files = await response.json();
			expect(Array.isArray(files)).toBe(true);
			expect(files.length).toBeGreaterThanOrEqual(3);

			// Verify file structure
			const uploadedKeys = testFiles.map((f) => f.key);
			const listedKeys = files.map((f) => f.key);

			for (const key of uploadedKeys) {
				expect(listedKeys).toContain(key);
			}

			// Check file properties
			files.forEach((file) => {
				expect(file).toHaveProperty('key');
				expect(file).toHaveProperty('size');
				expect(file).toHaveProperty('uploaded');
			});

			// Cleanup
			for (const { key } of testFiles) {
				await env.MY_BUCKET.delete(key);
			}
		});

		it('returns empty array when no files exist', async () => {
			// Clear all files
			const listed = await env.MY_BUCKET.list();
			for (const obj of listed.objects) {
				await env.MY_BUCKET.delete(obj.key);
			}

			const response = await SELF.fetch('http://example.com/_list');
			expect(response.status).toBe(200);
			const files = await response.json();
			expect(Array.isArray(files)).toBe(true);
			expect(files.length).toBe(0);
		});
	});

	describe('DELETE - Remove files', () => {
		it('deletes an existing file successfully', async () => {
			// First upload a file
			await env.MY_BUCKET.put(testKey, testContent);

			// Delete it
			const response = await SELF.fetch(`http://example.com/${testKey}`, {
				method: 'DELETE',
			});

			expect(response.status).toBe(200);
			const body = await response.text();
			expect(body).toBe('Deleted!');

			// Verify it's gone
			const storedObject = await env.MY_BUCKET.get(testKey);
			expect(storedObject).toBeNull();
		});

		it('handles deletion of non-existent files gracefully', async () => {
			const response = await SELF.fetch('http://example.com/non-existent.md', {
				method: 'DELETE',
			});

			expect(response.status).toBe(200);
			const body = await response.text();
			expect(body).toBe('Deleted!');
		});
	});

	describe('CORS support', () => {
		it('handles OPTIONS preflight requests', async () => {
			const response = await SELF.fetch(`http://example.com/${testKey}`, {
				method: 'OPTIONS',
			});

			expect(response.status).toBe(200);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
			expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
			expect(response.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
			expect(response.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
		});
	});

	describe('Error handling', () => {
		it('returns 405 for unsupported methods', async () => {
			const response = await SELF.fetch(`http://example.com/${testKey}`, {
				method: 'POST',
				body: testContent,
			});

			expect(response.status).toBe(405);
			const body = await response.text();
			expect(body).toBe('Method Not Allowed');
			expect(response.headers.get('Allow')).toBe('PUT, GET, DELETE, OPTIONS');
		});
	});

	describe('File synchronization workflow', () => {
		it('simulates complete sync: upload, retrieve, verify, delete', async () => {
			const syncKey = 'notes/my-note.md';
			const syncContent = '# My Note\n\nSome content here.';

			// 1. Upload (sync to R2)
			const putResponse = await SELF.fetch(`http://example.com/${syncKey}`, {
				method: 'PUT',
				body: syncContent,
			});
			expect(putResponse.status).toBe(200);
			await putResponse.text(); // Consume body

			// 2. Retrieve (verify sync)
			const getResponse = await SELF.fetch(`http://example.com/${syncKey}`);
			expect(getResponse.status).toBe(200);
			const retrievedContent = await getResponse.text();
			expect(retrievedContent).toBe(syncContent);

			// 3. Delete (remove from sync)
			const deleteResponse = await SELF.fetch(`http://example.com/${syncKey}`, {
				method: 'DELETE',
			});
			expect(deleteResponse.status).toBe(200);
			await deleteResponse.text(); // Consume body

			// 4. Verify deletion
			const verifyResponse = await SELF.fetch(`http://example.com/${syncKey}`);
			expect(verifyResponse.status).toBe(404);
			await verifyResponse.text(); // Consume body
		});
	});
});
