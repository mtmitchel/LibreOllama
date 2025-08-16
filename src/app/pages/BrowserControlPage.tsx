import React from 'react';
import { BrowserModalController } from '../../components/browser/BrowserModalController';

export function BrowserControlPage() {
	// Support both router and direct-hash usage
	let windowLabel: string | undefined;
	let url = '';
	try {
		const hash = typeof window !== 'undefined' ? window.location.hash : '';
		const hasHashParams = hash.includes('?');
		const searchFromHash = hasHashParams ? hash.substring(hash.indexOf('?') + 1) : '';
		const searchFromPath = typeof window !== 'undefined' ? window.location.search.substring(1) : '';
		const search = searchFromHash || searchFromPath;
		const params = new URLSearchParams(search);
		windowLabel = params.get('windowLabel') || undefined;
		url = params.get('url') || '';
	} catch {}

	if (!windowLabel) return null;
	return <BrowserModalController windowLabel={windowLabel} url={url} />;
}
