import React from 'react';
import { BrowserModalController } from '../../components/browser/BrowserModalController';

export function BrowserControlPage() {
	// Support both router and direct-hash usage
	let windowLabel: string | undefined;
	let url = '';
	let mode: 'toolbar' | 'overlay' = 'toolbar';
	try {
		const hash = typeof window !== 'undefined' ? window.location.hash : '';
		const hasHashParams = hash.includes('?');
		const searchFromHash = hasHashParams ? hash.substring(hash.indexOf('?') + 1) : '';
		const searchFromPath = typeof window !== 'undefined' ? window.location.search.substring(1) : '';
		const search = searchFromHash || searchFromPath;
		const params = new URLSearchParams(search);
		windowLabel = params.get('windowLabel') || undefined;
		url = params.get('url') || '';
		// Check if mode is explicitly set in params
		const modeParam = params.get('mode');
		if (modeParam === 'overlay' || modeParam === 'toolbar') {
			mode = modeParam;
		}
	} catch {}

	if (!windowLabel) return null;
	return (
		<div className="w-full h-full bg-white dark:bg-gray-900">
			<BrowserModalController windowLabel={windowLabel} url={url} mode={mode} />
		</div>
	);
}
