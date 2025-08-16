import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import { ExternalLink, Loader2, X as Close } from 'lucide-react';
import { Button, Page, Card, Text, Heading } from '../../components/ui';
import { cn } from '../../core/lib/utils';

export function ReaderView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get('url');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<{
    title: string;
    byline: string;
    content: string;
    siteName: string;
    excerpt: string;
  } | null>(null);

  useEffect(() => {
    if (!url) {
      setError('No URL provided');
      setLoading(false);
      return;
    }

    fetchAndParseArticle(url);
  }, [url]);

  const fetchAndParseArticle = async (targetUrl: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch HTML from backend
      const html = await invoke<string>('fetch_url_html', { url: targetUrl });
      
      // Parse HTML with DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Set base URL for relative links
      const base = doc.createElement('base');
      base.href = targetUrl;
      doc.head.appendChild(base);
      
      // Extract article with Readability
      const reader = new Readability(doc, {
        debug: false,
        maxElemsToParse: 0,
        nbTopCandidates: 5,
        charThreshold: 500,
      });
      
      const parsedArticle = reader.parse();
      
      if (!parsedArticle) {
        throw new Error('Could not extract article content');
      }
      
      // Pre-process: strip visual clutter before sanitize (images, figures, tables, superscript refs)
      const tmpDoc = parser.parseFromString(parsedArticle.content, 'text/html');
      const selectorsToRemove = ['img', 'picture', 'figure', 'figcaption', 'svg', 'table', 'sup'];
      selectorsToRemove.forEach((sel) => {
        tmpDoc.querySelectorAll(sel).forEach((el) => el.remove());
      });
      // Add spacing classes to common elements to avoid reliance on external typography plugin
      tmpDoc.querySelectorAll('p').forEach((el) => {
        el.classList.add('mb-5', 'leading-8');
      });
      tmpDoc.querySelectorAll('h1,h2,h3').forEach((el) => {
        el.classList.add('mt-8', 'mb-3', 'font-semibold', 'tracking-tight');
      });
      tmpDoc.querySelectorAll('ul').forEach((el) => {
        el.classList.add('list-disc', 'pl-6', 'my-5');
      });
      tmpDoc.querySelectorAll('ol').forEach((el) => {
        el.classList.add('list-decimal', 'pl-6', 'my-5');
      });
      tmpDoc.querySelectorAll('blockquote').forEach((el) => {
        el.classList.add('border-l-4', 'pl-4', 'italic', 'my-6');
      });
      const preprocessedHtml = tmpDoc.body.innerHTML;

      // Sanitize the content
      const cleanContent = DOMPurify.sanitize(preprocessedHtml, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
        FORBID_TAGS: ['style', 'script', 'img', 'picture', 'figure', 'figcaption', 'svg', 'table'],
        FORBID_ATTR: ['style']
      });
      
      setArticle({
        title: parsedArticle.title || 'Untitled',
        byline: parsedArticle.byline || '',
        content: cleanContent,
        siteName: parsedArticle.siteName || new URL(targetUrl).hostname,
        excerpt: parsedArticle.excerpt || ''
      });
    } catch (err) {
      console.error('Failed to load article:', err);
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSite = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSite}
              className="flex items-center gap-2"
            >
              <ExternalLink size={16} />
              View original
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <Close size={16} />
            Close
          </Button>
        </div>

        {/* Content */}
        {loading && (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <Text variant="secondary" className="text-gray-500">
                Loading article...
              </Text>
            </div>
          </Card>
        )}

        {error && (
          <Card className="p-8">
            <Heading level={3} className="text-red-600 dark:text-red-400 mb-2">
              Failed to load article
            </Heading>
            <Text variant="secondary" className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </Text>
            {url && (
              <Button onClick={handleBackToSite} variant="outline" size="sm">
                Open original page
              </Button>
            )}
          </Card>
        )}

        {article && !loading && !error && (
          <Card className="p-8 lg:p-12">
            {/* Article Header */}
            <header className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <Heading level={1} className="mb-4">
                {article.title}
              </Heading>
              
              {article.byline && (
                <Text variant="secondary" size="sm" className="mb-2">
                  By {article.byline}
                </Text>
              )}
              
              <Text variant="caption" size="sm">
                {article.siteName}
              </Text>
            </header>

            {/* Article Content */}
            <article className="mx-auto max-w-3xl">
              <Text as="div" size="base" className="leading-8 space-y-6">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </Text>
            </article>
          </Card>
        )}
      </div>
    </div>
  );
}