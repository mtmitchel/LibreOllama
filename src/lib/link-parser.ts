// Removed unused imports - types are defined locally in this file

export interface LinkTarget {
  id: string;
  type: 'note' | 'task' | 'chat' | 'chat_session';
  title: string;
  content?: string;
}

export interface ParsedLink {
  text: string;
  target: string;
  type: 'internal' | 'external';
  startIndex: number;
  endIndex: number;
}

export interface LinkRelationship {
  id: string;
  sourceId: string;
  sourceType: 'note' | 'task' | 'chat' | 'chat_session';
  targetId: string;
  targetType: 'note' | 'task' | 'chat' | 'chat_session';
  linkText: string;
  contextSnippet: string;
  createdAt: string;
  updatedAt: string;
}

export class LinkParser {
  private static readonly LINK_REGEX = /\[\[([^\]]+)\]\]/g;
  private static readonly CONTEXT_SNIPPET_LENGTH = 100;

  /**
   * Parse [[]] syntax links from text content
   */
  static parseLinks(content: string): ParsedLink[] {
    const links: ParsedLink[] = [];
    let match;
    
    // Reset regex lastIndex to ensure fresh parsing
    this.LINK_REGEX.lastIndex = 0;
    
    while ((match = this.LINK_REGEX.exec(content)) !== null) {
      const linkText = match[1].trim();
      
      links.push({
        text: linkText,
        target: this.normalizeTarget(linkText),
        type: this.isExternalLink(linkText) ? 'external' : 'internal',
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    return links;
  }

  /**
   * Extract context snippet around a link
   */
  static extractContextSnippet(content: string, linkStartIndex: number, linkEndIndex: number): string {
    const beforeStart = Math.max(0, linkStartIndex - this.CONTEXT_SNIPPET_LENGTH / 2);
    const afterEnd = Math.min(content.length, linkEndIndex + this.CONTEXT_SNIPPET_LENGTH / 2);
    
    let snippet = content.slice(beforeStart, afterEnd).trim();
    
    // Add ellipsis if truncated
    if (beforeStart > 0) snippet = '...' + snippet;
    if (afterEnd < content.length) snippet = snippet + '...';
    
    return snippet;
  }

  /**
   * Create bidirectional link relationships from parsed content
   */
  static createLinkRelationships(
    sourceId: string,
    sourceType: 'note' | 'task' | 'chat' | 'chat_session',
    content: string,
    availableTargets: LinkTarget[]
  ): LinkRelationship[] {
    const links = this.parseLinks(content);
    const relationships: LinkRelationship[] = [];
    
    for (const link of links) {
      if (link.type === 'internal') {
        const target = this.findLinkTarget(link.target, availableTargets);
        
        if (target) {
          const contextSnippet = this.extractContextSnippet(
            content,
            link.startIndex,
            link.endIndex
          );
          
          relationships.push({
            id: `link-${sourceId}-${target.id}-${Date.now()}`,
            sourceId,
            sourceType,
            targetId: target.id,
            targetType: target.type,
            linkText: link.text,
            contextSnippet,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
    
    return relationships;
  }

  /**
   * Find matching target for a link
   */
  static findLinkTarget(normalizedTarget: string, availableTargets: LinkTarget[]): LinkTarget | null {
    // Exact match by normalized title
    let target = availableTargets.find(t => 
      this.normalizeTarget(t.title) === normalizedTarget
    );
    
    if (target) return target;
    
    // Fuzzy match by partial title
    target = availableTargets.find(t => 
      this.normalizeTarget(t.title).includes(normalizedTarget) ||
      normalizedTarget.includes(this.normalizeTarget(t.title))
    );
    
    if (target) return target;
    
    // Match by ID if target looks like an ID
    if (normalizedTarget.match(/^[a-zA-Z0-9-_]+$/)) {
      target = availableTargets.find(t => t.id === normalizedTarget);
    }
    
    return target || null;
  }

  /**
   * Normalize link target for consistent matching
   */
  static normalizeTarget(target: string): string {
    return target
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
  }

  /**
   * Check if link is external (URL)
   */
  static isExternalLink(linkText: string): boolean {
    return /^https?:\/\//.test(linkText) || linkText.includes('.');
  }

  /**
   * Render parsed content with clickable links
   */
  static renderWithLinks(
    content: string,
    _onLinkClick: (target: string, linkText: string) => void,
    availableTargets: LinkTarget[] = []
  ): Array<{ type: 'text' | 'link'; content: string; target?: string; exists?: boolean }> {
    const links = this.parseLinks(content);
    const parts: Array<{ type: 'text' | 'link'; content: string; target?: string; exists?: boolean }> = [];
    
    let lastIndex = 0;
    
    for (const link of links) {
      // Add text before link
      if (link.startIndex > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, link.startIndex)
        });
      }
      
      // Add link
      const target = this.findLinkTarget(link.target, availableTargets);
      parts.push({
        type: 'link',
        content: link.text,
        target: link.target,
        exists: !!target
      });
      
      lastIndex = link.endIndex;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }
    
    return parts;
  }

  /**
   * Generate auto-completion suggestions for link typing
   */
  static generateLinkSuggestions(
    partialText: string,
    availableTargets: LinkTarget[],
    maxSuggestions: number = 10
  ): LinkTarget[] {
    const normalized = this.normalizeTarget(partialText);
    
    if (normalized.length < 2) return [];
    
    return availableTargets
      .filter(target => 
        this.normalizeTarget(target.title).includes(normalized) ||
        (target.content && this.normalizeTarget(target.content).includes(normalized))
      )
      .sort((a, b) => {
        // Prioritize title matches over content matches
        const aInTitle = this.normalizeTarget(a.title).includes(normalized);
        const bInTitle = this.normalizeTarget(b.title).includes(normalized);
        
        if (aInTitle && !bInTitle) return -1;
        if (!aInTitle && bInTitle) return 1;
        
        // Then sort by title length (shorter = more relevant)
        return a.title.length - b.title.length;
      })
      .slice(0, maxSuggestions);
  }

  /**
   * Update link relationships when content changes
   */
  static updateLinkRelationships(
    sourceId: string,
    sourceType: 'note' | 'task' | 'chat' | 'chat_session',
    oldContent: string,
    newContent: string,
    availableTargets: LinkTarget[],
    existingRelationships: LinkRelationship[]
  ): {
    toAdd: LinkRelationship[];
    toRemove: string[];
    toUpdate: LinkRelationship[];
  } {
    const oldLinks = this.parseLinks(oldContent);
    const newLinks = this.parseLinks(newContent);
    
    const toAdd: LinkRelationship[] = [];
    const toRemove: string[] = [];
    const toUpdate: LinkRelationship[] = [];
    
    // Find new links to add
    for (const newLink of newLinks) {
      const existsInOld = oldLinks.some(oldLink => oldLink.target === newLink.target);
      
      if (!existsInOld) {
        const target = this.findLinkTarget(newLink.target, availableTargets);
        if (target) {
          const contextSnippet = this.extractContextSnippet(
            newContent,
            newLink.startIndex,
            newLink.endIndex
          );
          
          toAdd.push({
            id: `link-${sourceId}-${target.id}-${Date.now()}`,
            sourceId,
            sourceType,
            targetId: target.id,
            targetType: target.type,
            linkText: newLink.text,
            contextSnippet,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
    
    // Find old links to remove
    for (const oldLink of oldLinks) {
      const existsInNew = newLinks.some(newLink => newLink.target === oldLink.target);
      
      if (!existsInNew) {
        const relationship = existingRelationships.find(rel => 
          rel.sourceId === sourceId && 
          this.normalizeTarget(rel.linkText) === oldLink.target
        );
        
        if (relationship) {
          toRemove.push(relationship.id);
        }
      }
    }
    
    // Find links to update (context changed)
    for (const newLink of newLinks) {
      const oldLink = oldLinks.find(old => old.target === newLink.target);
      
      if (oldLink) {
        const relationship = existingRelationships.find(rel => 
          rel.sourceId === sourceId && 
          this.normalizeTarget(rel.linkText) === newLink.target
        );
        
        if (relationship) {
          const newContextSnippet = this.extractContextSnippet(
            newContent,
            newLink.startIndex,
            newLink.endIndex
          );
          
          if (relationship.contextSnippet !== newContextSnippet) {
            toUpdate.push({
              ...relationship,
              contextSnippet: newContextSnippet,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
    }
    
    return { toAdd, toRemove, toUpdate };
  }
}