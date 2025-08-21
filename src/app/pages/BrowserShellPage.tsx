import React, { useEffect, useMemo, useRef } from 'react';
import { Button } from '../../components/ui';
import { RefreshCw, ExternalLink, Copy, BookOpen, X as Close } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

export function BrowserShellPage() {
	const params = useMemo(() => {
		const hash = typeof window !== 'undefined' ? window.location.hash : '';
		const hasHashParams = hash.includes('?');
		const searchFromHash = hasHashParams ? hash.substring(hash.indexOf('?') + 1) : '';
		const searchFromPath = typeof window !== 'undefined' ? window.location.search.substring(1) : '';
		const search = searchFromHash || searchFromPath;
		return new URLSearchParams(search);
	}, []);

	const targetUrl = decodeURIComponent(params.get('url') || '');
	const navigate = useNavigate();

	useEffect(() => {
		document.title = 'Browser';
	}, []);

	const handleOpenExternal = () => {
		window.open(targetUrl, '_blank', 'noopener,noreferrer');
	};

	const handleCopy = async () => {
		try { await navigator.clipboard.writeText(targetUrl); } catch {}
	};

	const iframeRef = useRef<HTMLIFrameElement>(null);
	const handleRefresh = () => {
		if (iframeRef.current) {
			const src = iframeRef.current.src;
			iframeRef.current.src = src;
		}
	};

	const handleClose = async () => {
		try {
			const current = getCurrentWebviewWindow();
			await current.close();
		} catch {}
	};

	// Use webview instead of iframe by navigating the window itself to the URL
	useEffect(() => {
		if (targetUrl && targetUrl !== 'about:blank') {
			// Navigate the entire webview to the target URL after a brief delay
			setTimeout(() => {
				window.location.href = targetUrl;
			}, 100);
		}
	}, [targetUrl]);

	return (
		<div className="flex h-screen w-screen flex-col bg-white">
			{/* Floating toolbar */}
			<div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50/95 backdrop-blur px-3 py-2 shadow-sm">
				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-600">Loading: {targetUrl}</span>
				</div>
				<div className="flex items-center gap-1">
					<Button size="icon" variant="ghost" title="Refresh" onClick={handleRefresh}><RefreshCw size={16} /></Button>
					<Button size="icon" variant="ghost" title="Copy link" onClick={handleCopy}><Copy size={16} /></Button>
					<Button
						size="icon"
						variant="ghost"
						title="Reader view"
						onClick={() => navigate(`/reader?url=${encodeURIComponent(targetUrl)}`)}
					>
						<BookOpen size={16} />
					</Button>
					<Button size="icon" variant="ghost" title="Open in browser" onClick={handleOpenExternal}><ExternalLink size={16} /></Button>
					<Button size="icon" variant="ghost" title="Close" onClick={handleClose}><Close size={16} /></Button>
				</div>
			</div>
			{/* Content will replace this entire page when navigation happens */}
			<div className="flex-1 bg-white pt-12 flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-500">Navigating to {targetUrl}...</p>
				</div>
			</div>
		</div>
	);
}
