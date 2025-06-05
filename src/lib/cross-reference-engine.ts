import { LinkParser, type LinkRelationship, type LinkTarget } from './link-parser';
import type { Item, ChatSession, TaskItem } from './types';

export interface BacklinkReference {
  id: string;
  sourceId: string;
  sourceType: 'note' | 'task' | 'chat' | 'chat_session';
  sourceTitle: string;
  linkText: string;
  contextSnippet: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrossReferenceData {
  targetId: string;
  targetType: 'note' | 'task' | 'chat' | 'chat_session';
  outgoingLinks: LinkRelationship[];
  backlinks: BacklinkReference[];
  relatedContent: Array<{
    id: string;
    type: 'note' | 'task' | 'chat' | 'chat_session';
    title: string;
    relevanceScore: number;
    sharedLinks: number;
  }>;
}

export interface ContentIndex {
  id: string;
  type: 'note' | 'task' | 'chat' | 'chat_session';
  title: string;
  content: string;
  tags: string[];
  links: string[];
  lastIndexed: string;
}

export class CrossReferenceEngine {
  private relationships: Map<string, LinkRelationship> = new Map();
  private contentIndex: Map<string, ContentIndex> = new Map();
  private backlinkIndex: Map<string, BacklinkReference[]> = new Map();

  /**
   * Initialize the engine with existing data
   */
  initialize(
    items: Item[],
    chatSessions: ChatSession[],
    tasks: TaskItem[],
    existingRelationships: LinkRelationship[] = []
  ): void {
    // Clear existing data
    this.relationships.clear();
    this.contentIndex.clear();
    this.backlinkIndex.clear();

    // Index existing relationships
    existingRelationships.forEach(rel => {
      this.relationships.set(rel.id, rel);
    });

    // Index all content
    this.indexItems(items);
    this.indexChatSessions(chatSessions);
    this.indexTasks(tasks);

    // Build backlink index
    this.buildBacklinkIndex();
  }

  /**
   * Index items (notes, whiteboards, etc.)
   */
  private indexItems(items: Item[]): void {
    items.forEach(item => {
      if (item.content) {
        const links = LinkParser.parseLinks(item.content);
        
        this.contentIndex.set(item.id, {
          id: item.id,
          type: item.type as 'note' | 'task' | 'chat' | 'chat_session',
          title: item.name,
          content: item.content,
          tags: item.tags || [],
          links: links.map(link => link.target),
          lastIndexed: new Date().toISOString()
        });
      }
    });
  }

  /**
   * Index chat sessions
   */
  private indexChatSessions(chatSessions: ChatSession[]): void {
    chatSessions.forEach(session => {
      const content = session.messages.map(msg => msg.content).join('\n');
      const links = LinkParser.parseLinks(content);
      
      this.contentIndex.set(session.id, {
        id: session.id,
        type: 'chat_session',
        title: session.title,
        content,
        tags: session.tags || [],
        links: links.map(link => link.target),
        lastIndexed: new Date().toISOString()
      });
    });
  }

  /**
   * Index tasks
   */
  private indexTasks(tasks: TaskItem[]): void {
    tasks.forEach(task => {
      const content = [task.title, task.description || ''].join('\n');
      const links = LinkParser.parseLinks(content);
      
      this.contentIndex.set(task.id, {
        id: task.id,
        type: 'task',
        title: task.title,
        content,
        tags: task.tags || [],
        links: links.map(link => link.target),
        lastIndexed: new Date().toISOString()
      });
    });
  }

  /**
   * Build backlink index from relationships
   */
  private buildBacklinkIndex(): void {
    this.backlinkIndex.clear();
    
    this.relationships.forEach(relationship => {
      const sourceContent = this.contentIndex.get(relationship.sourceId);
      
      if (sourceContent) {
        const backlink: BacklinkReference = {
          id: relationship.id,
          sourceId: relationship.sourceId,
          sourceType: relationship.sourceType,
          sourceTitle: sourceContent.title,
          linkText: relationship.linkText,
          contextSnippet: relationship.contextSnippet,
          createdAt: relationship.createdAt,
          updatedAt: relationship.updatedAt
        };

        const existing = this.backlinkIndex.get(relationship.targetId) || [];
        existing.push(backlink);
        this.backlinkIndex.set(relationship.targetId, existing);
      }
    });
  }

  /**
   * Update content and its relationships
   */
  updateContent(
    id: string,
    type: 'note' | 'task' | 'chat' | 'chat_session',
    title: string,
    content: string,
    tags: string[] = []
  ): {
    addedRelationships: LinkRelationship[];
    removedRelationshipIds: string[];
    updatedRelationships: LinkRelationship[];
  } {
    const oldContent = this.contentIndex.get(id);
    const availableTargets = this.getAvailableTargets();
    
    // Get existing relationships for this content
    const existingRelationships = Array.from(this.relationships.values())
      .filter(rel => rel.sourceId === id);

    // Calculate relationship changes
    const changes = LinkParser.updateLinkRelationships(
      id,
      type,
      oldContent?.content || '',
      content,
      availableTargets,
      existingRelationships
    );

    // Apply changes to relationship store
    changes.toAdd.forEach(rel => {
      this.relationships.set(rel.id, rel);
    });

    changes.toRemove.forEach(relId => {
      this.relationships.delete(relId);
    });

    changes.toUpdate.forEach(rel => {
      this.relationships.set(rel.id, rel);
    });

    // Update content index
    const links = LinkParser.parseLinks(content);
    this.contentIndex.set(id, {
      id,
      type,
      title,
      content,
      tags,
      links: links.map(link => link.target),
      lastIndexed: new Date().toISOString()
    });

    // Rebuild backlink index
    this.buildBacklinkIndex();

    return {
      addedRelationships: changes.toAdd,
      removedRelationshipIds: changes.toRemove,
      updatedRelationships: changes.toUpdate
    };
  }

  /**
   * Get cross-reference data for a specific item
   */
  getCrossReferenceData(id: string): CrossReferenceData | null {
    const content = this.contentIndex.get(id);
    if (!content) return null;

    // Get outgoing links
    const outgoingLinks = Array.from(this.relationships.values())
      .filter(rel => rel.sourceId === id);

    // Get backlinks
    const backlinks = this.backlinkIndex.get(id) || [];

    // Calculate related content
    const relatedContent = this.calculateRelatedContent(id);

    return {
      targetId: id,
      targetType: content.type,
      outgoingLinks,
      backlinks,
      relatedContent
    };
  }

  /**
   * Calculate related content based on shared links and tags
   */
  private calculateRelatedContent(id: string): Array<{
    id: string;
    type: 'note' | 'task' | 'chat' | 'chat_session';
    title: string;
    relevanceScore: number;
    sharedLinks: number;
  }> {
    const targetContent = this.contentIndex.get(id);
    if (!targetContent) return [];

    const related: Array<{
      id: string;
      type: 'note' | 'task' | 'chat' | 'chat_session';
      title: string;
      relevanceScore: number;
      sharedLinks: number;
    }> = [];

    this.contentIndex.forEach((content, contentId) => {
      if (contentId === id) return;

      let relevanceScore = 0;
      let sharedLinks = 0;

      // Calculate shared links
      const sharedLinkTargets = content.links.filter(link => 
        targetContent.links.includes(link)
      );
      sharedLinks = sharedLinkTargets.length;
      relevanceScore += sharedLinks * 3; // Weight shared links heavily

      // Calculate shared tags
      const sharedTags = content.tags.filter(tag => 
        targetContent.tags.includes(tag)
      );
      relevanceScore += sharedTags.length * 2;

      // Check if content links to target or vice versa
      const hasDirectLink = content.links.some(link => 
        LinkParser.normalizeTarget(link) === LinkParser.normalizeTarget(targetContent.title)
      );
      const hasBacklink = targetContent.links.some(link => 
        LinkParser.normalizeTarget(link) === LinkParser.normalizeTarget(content.title)
      );
      
      if (hasDirectLink || hasBacklink) {
        relevanceScore += 5;
      }

      // Content similarity (basic keyword matching)
      const targetWords = this.extractKeywords(targetContent.content);
      const contentWords = this.extractKeywords(content.content);
      const sharedWords = targetWords.filter(word => contentWords.includes(word));
      relevanceScore += sharedWords.length * 0.5;

      if (relevanceScore > 0) {
        related.push({
          id: contentId,
          type: content.type,
          title: content.title,
          relevanceScore,
          sharedLinks
        });
      }
    });

    return related
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10); // Limit to top 10 related items
  }

  /**
   * Extract keywords from content for similarity matching
   */
  private extractKeywords(content: string): string[] {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word))
      .slice(0, 50); // Limit to first 50 keywords
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
      'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
    ]);
    return stopWords.has(word);
  }

  /**
   * Get available link targets
   */
  private getAvailableTargets(): LinkTarget[] {
    return Array.from(this.contentIndex.values()).map(content => ({
      id: content.id,
      type: content.type,
      title: content.title,
      content: content.content
    }));
  }

  /**
   * Search for content by query
   */
  searchContent(query: string, maxResults: number = 20): Array<{
    id: string;
    type: 'note' | 'task' | 'chat' | 'chat_session';
    title: string;
    snippet: string;
    relevanceScore: number;
  }> {
    const normalizedQuery = query.toLowerCase();
    const results: Array<{
      id: string;
      type: 'note' | 'task' | 'chat' | 'chat_session';
      title: string;
      snippet: string;
      relevanceScore: number;
    }> = [];

    this.contentIndex.forEach(content => {
      let relevanceScore = 0;
      
      // Title match (highest weight)
      if (content.title.toLowerCase().includes(normalizedQuery)) {
        relevanceScore += 10;
      }

      // Tag match
      const tagMatch = content.tags.some(tag => 
        tag.toLowerCase().includes(normalizedQuery)
      );
      if (tagMatch) {
        relevanceScore += 5;
      }

      // Content match
      const contentMatch = content.content.toLowerCase().includes(normalizedQuery);
      if (contentMatch) {
        relevanceScore += 3;
      }

      if (relevanceScore > 0) {
        // Extract snippet around match
        const contentLower = content.content.toLowerCase();
        const matchIndex = contentLower.indexOf(normalizedQuery);
        let snippet = content.content;
        
        if (matchIndex !== -1) {
          const start = Math.max(0, matchIndex - 50);
          const end = Math.min(content.content.length, matchIndex + normalizedQuery.length + 50);
          snippet = content.content.slice(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < content.content.length) snippet = snippet + '...';
        } else {
          snippet = content.content.slice(0, 100) + (content.content.length > 100 ? '...' : '');
        }

        results.push({
          id: content.id,
          type: content.type,
          title: content.title,
          snippet,
          relevanceScore
        });
      }
    });

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }

  /**
   * Get all relationships
   */
  getAllRelationships(): LinkRelationship[] {
    return Array.from(this.relationships.values());
  }

  /**
   * Remove content and its relationships
   */
  removeContent(id: string): string[] {
    // Remove from content index
    this.contentIndex.delete(id);

    // Remove all relationships involving this content
    const removedRelationshipIds: string[] = [];
    
    this.relationships.forEach((relationship, relationshipId) => {
      if (relationship.sourceId === id || relationship.targetId === id) {
        this.relationships.delete(relationshipId);
        removedRelationshipIds.push(relationshipId);
      }
    });

    // Rebuild backlink index
    this.buildBacklinkIndex();

    return removedRelationshipIds;
  }

  /**
   * Rename content and update all references
   */
  renameContent(id: string, newTitle: string): LinkRelationship[] {
    const content = this.contentIndex.get(id);
    if (!content) return [];

    const oldTitle = content.title;
    const updatedRelationships: LinkRelationship[] = [];

    // Update content index
    this.contentIndex.set(id, {
      ...content,
      title: newTitle,
      lastIndexed: new Date().toISOString()
    });

    // Update all relationships that reference the old title
    this.relationships.forEach(relationship => {
      if (LinkParser.normalizeTarget(relationship.linkText) === LinkParser.normalizeTarget(oldTitle)) {
        const updated = {
          ...relationship,
          linkText: newTitle,
          updatedAt: new Date().toISOString()
        };
        this.relationships.set(relationship.id, updated);
        updatedRelationships.push(updated);
      }
    });

    // Rebuild backlink index
    this.buildBacklinkIndex();

    return updatedRelationships;
  }

  /**
   * Get statistics about the cross-reference network
   */
  getNetworkStatistics(): {
    totalContent: number;
    totalRelationships: number;
    totalBacklinks: number;
    mostLinkedContent: Array<{ id: string; title: string; linkCount: number }>;
    orphanedContent: Array<{ id: string; title: string }>;
  } {
    const totalContent = this.contentIndex.size;
    const totalRelationships = this.relationships.size;
    
    // Count backlinks
    let totalBacklinks = 0;
    this.backlinkIndex.forEach(backlinks => {
      totalBacklinks += backlinks.length;
    });

    // Find most linked content
    const linkCounts = new Map<string, number>();
    this.backlinkIndex.forEach((backlinks, targetId) => {
      linkCounts.set(targetId, backlinks.length);
    });

    const mostLinkedContent = Array.from(linkCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => {
        const content = this.contentIndex.get(id);
        return {
          id,
          title: content?.title || 'Unknown',
          linkCount: count
        };
      });

    // Find orphaned content (no incoming or outgoing links)
    const orphanedContent: Array<{ id: string; title: string }> = [];
    this.contentIndex.forEach((content, id) => {
      const hasOutgoingLinks = Array.from(this.relationships.values())
        .some(rel => rel.sourceId === id);
      const hasIncomingLinks = this.backlinkIndex.has(id);
      
      if (!hasOutgoingLinks && !hasIncomingLinks) {
        orphanedContent.push({
          id,
          title: content.title
        });
      }
    });

    return {
      totalContent,
      totalRelationships,
      totalBacklinks,
      mostLinkedContent,
      orphanedContent
    };
  }
}