export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		// Decode the URL-encoded pathname to get the original filename
		const key = decodeURIComponent(url.pathname.slice(1));

		// Serve the frontend for root path
		if (key === '' || key === 'index.html') {
			const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>R2 Markdown Browser</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        h1 { font-size: 2.5em; margin-bottom: 10px; font-weight: 600; }
        .subtitle { font-size: 1.1em; opacity: 0.9; }
        .controls {
            padding: 20px 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }
        .search-box {
            flex: 1;
            min-width: 250px;
            position: relative;
        }
        .search-box input {
            width: 100%;
            padding: 12px 15px 12px 45px;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            font-size: 15px;
            transition: border-color 0.3s;
        }
        .search-box input:focus {
            outline: none;
            border-color: #667eea;
        }
        .search-icon {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #6c757d;
        }
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .stats {
            display: flex;
            gap: 20px;
            padding: 15px 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            font-size: 14px;
            color: #6c757d;
        }
        .stat-item { display: flex; align-items: center; gap: 5px; }
        .stat-value { font-weight: 600; color: #495057; }
        .file-list { max-height: 600px; overflow-y: auto; }
        .file-item {
            padding: 15px 30px;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: background 0.2s;
            cursor: pointer;
        }
        .file-item:hover { background: #f8f9fa; }
        .file-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            flex-shrink: 0;
        }
        .file-info { flex: 1; min-width: 0; }
        .file-name {
            font-weight: 500;
            color: #212529;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .file-meta { font-size: 13px; color: #6c757d; }
        .file-actions { display: flex; gap: 10px; }
        .btn-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            border: none;
            background: #e9ecef;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            color: #495057;
        }
        .btn-icon:hover {
            background: #667eea;
            color: white;
            transform: scale(1.1);
        }
        .loading {
            text-align: center;
            padding: 60px 30px;
            color: #6c757d;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .error {
            text-align: center;
            padding: 60px 30px;
            color: #dc3545;
        }
        .empty {
            text-align: center;
            padding: 60px 30px;
            color: #6c757d;
        }
        .empty-icon {
            font-size: 64px;
            margin-bottom: 20px;
            opacity: 0.3;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📚 R2 Markdown Browser</h1>
            <div class="subtitle">Browse your Obsidian vault in the cloud</div>
        </header>
        <div class="controls">
            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input type="text" id="searchInput" placeholder="Search files..." autocomplete="off">
            </div>
            <button class="btn btn-primary" id="refreshBtn">🔄 Refresh</button>
        </div>
        <div class="stats" id="stats" style="display: none;">
            <div class="stat-item">
                <span>📄</span>
                <span class="stat-value" id="totalFiles">0</span>
                <span>files</span>
            </div>
            <div class="stat-item">
                <span>💾</span>
                <span class="stat-value" id="totalSize">0 B</span>
            </div>
            <div class="stat-item">
                <span>🔍</span>
                <span class="stat-value" id="filteredCount">0</span>
                <span>shown</span>
            </div>
        </div>
        <div id="content">
            <div class="loading">
                <div class="spinner"></div>
                <div>Loading files...</div>
            </div>
        </div>
    </div>
    <script>
        let allFiles = [], filteredFiles = [];
        function formatBytes(b) {
            if (b === 0) return '0 B';
            const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(b) / Math.log(k));
            return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + s[i];
        }
        function formatDate(d) {
            const date = new Date(d);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }
        function getFileIcon(f) { return f.endsWith('.md') ? 'MD' : '📄'; }
        async function loadFiles() {
            try {
                document.getElementById('content').innerHTML = '<div class="loading"><div class="spinner"></div><div>Loading files...</div></div>';
                const r = await fetch('/_list');
                if (!r.ok) throw new Error(\`HTTP \${r.status}: \${r.statusText}\`);
                allFiles = await r.json();
                filteredFiles = [...allFiles];
                renderFiles();
                updateStats();
            } catch (e) {
                document.getElementById('content').innerHTML = \`<div class="error"><div style="font-size: 48px; margin-bottom: 20px;">⚠️</div><div style="font-size: 18px; font-weight: 500; margin-bottom: 10px;">Failed to load files</div><div>\${e.message}</div></div>\`;
            }
        }
        function renderFiles() {
            const c = document.getElementById('content');
            if (filteredFiles.length === 0) {
                c.innerHTML = '<div class="empty"><div class="empty-icon">📭</div><div style="font-size: 18px; font-weight: 500;">No files found</div></div>';
                return;
            }
            const fl = document.createElement('div');
            fl.className = 'file-list';
            filteredFiles.forEach(f => {
                const i = document.createElement('div');
                i.className = 'file-item';
                const ek = encodeURIComponent(f.key);
                i.innerHTML = \`<div class="file-icon">\${getFileIcon(f.key)}</div><div class="file-info"><div class="file-name" title="\${f.key}">\${f.key}</div><div class="file-meta">\${formatBytes(f.size)} • \${formatDate(f.uploaded)}</div></div><div class="file-actions"><button class="btn-icon" title="Download" onclick="downloadFile('\${ek}')">💾</button><button class="btn-icon" title="View" onclick="viewFile('\${ek}')">👁️</button></div>\`;
                fl.appendChild(i);
            });
            c.innerHTML = '';
            c.appendChild(fl);
        }
        function updateStats() {
            const ts = allFiles.reduce((s, f) => s + f.size, 0);
            document.getElementById('totalFiles').textContent = allFiles.length;
            document.getElementById('totalSize').textContent = formatBytes(ts);
            document.getElementById('filteredCount').textContent = filteredFiles.length;
            document.getElementById('stats').style.display = 'flex';
        }
        function filterFiles(q) {
            const lq = q.toLowerCase();
            filteredFiles = allFiles.filter(f => f.key.toLowerCase().includes(lq));
            renderFiles();
            updateStats();
        }
        window.downloadFile = function(ek) {
            const l = document.createElement('a');
            l.href = '/'+ek;
            l.download = decodeURIComponent(ek);
            l.click();
        };
        window.viewFile = function(ek) { window.open('/'+ek, '_blank'); };
        document.getElementById('searchInput').addEventListener('input', (e) => filterFiles(e.target.value));
        document.getElementById('refreshBtn').addEventListener('click', loadFiles);
        loadFiles();
    </script>
</body>
</html>`;
			return new Response(html, {
				headers: { 'Content-Type': 'text/html' },
			});
		}

		switch (request.method) {
			case 'PUT': {
				try {
					await env.MY_BUCKET.put(key, request.body);
					return new Response(`Put ${key} successfully!`);
				} catch (err) {
					return new Response(`Error: ${err.message}`, { status: 500 });
				}
			}

			case 'GET': {
				// Special endpoint to list all files
				if (key === '_list') {
					try {
						const listed = await env.MY_BUCKET.list();
						const files = listed.objects.map((obj) => ({
							key: obj.key,
							size: obj.size,
							uploaded: obj.uploaded,
						}));
						return new Response(JSON.stringify(files), {
							headers: { 'Content-Type': 'application/json' },
						});
					} catch (err) {
						return new Response(`Error listing files: ${err.message}`, { status: 500 });
					}
				}

				const object = await env.MY_BUCKET.get(key);

				if (!object) {
					return new Response('Object Not Found', { status: 404 });
				}

				const headers = new Headers();
				object.writeHttpMetadata(headers);
				headers.set('etag', object.httpEtag);
				headers.set('Access-Control-Allow-Origin', '*');

				return new Response(object.body ?? undefined, {
					status: object.body ? 200 : 412,
					headers,
				});
			}

			case 'DELETE': {
				await env.MY_BUCKET.delete(key);
				return new Response('Deleted!');
			}

			case 'OPTIONS': {
				return new Response(null, {
					headers: {
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type',
					},
				});
			}

			default:
				return new Response('Method Not Allowed', {
					status: 405,
					headers: {
						Allow: 'PUT, GET, DELETE, OPTIONS',
						'Access-Control-Allow-Origin': '*',
					},
				});
		}
	},
};
