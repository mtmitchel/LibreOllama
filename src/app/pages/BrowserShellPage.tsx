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

	return (
		<div className="flex h-screen w-screen flex-col bg-white">
			{/* Top bar */}
			<div className="flex items-center justify-end gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
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
			{/* Content placeholder - will be child webview later */}
			<div className="flex-1 bg-white">
				<iframe ref={iframeRef} title="page" src={targetUrl} className="h-full w-full" />
			</div>
		</div>
	);
}
