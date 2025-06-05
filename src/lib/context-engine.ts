import { ContextRelationship, ContextSuggestion, Item, ChatSession, TaskItem } from './types';
import { Note, Block } from '../components/notes/BlockEditor';

export interface ContextAnalysisResult {
  relationships: ContextRelationship[];
  suggestions: ContextSuggestion[];
  topics: string[];
  keywords: string[];
  confidence: number;
}

export interface ContentItem {
  id: string;
  type: 'note' | 'task' | 'chat' | 'agent';
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export class SmartContextEngine {
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
    'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs'
  ]);

  private relationships: ContextRelationship[] = [];
  private contentCache: Map<string, ContentItem> = new Map();

  /**
   * Extract keywords from text content
   */
  private extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word));

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Return top keywords by frequency
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Extract topics using simple pattern matching
   */
  private extractTopics(text: string, tags: string[]): string[] {
    const topics = new Set<string>();

    // Add explicit tags as topics
    tags.forEach(tag => topics.add(tag.toLowerCase()));

    // Look for topic patterns in text
    const topicPatterns = [
      /(?:project|task|work)\s+(\w+)/gi,
      /(?:meeting|discussion)\s+(?:about|on|regarding)\s+(\w+)/gi,
      /(?:research|study|analysis)\s+(?:on|of|about)\s+(\w+)/gi,
      /(?:implement|develop|build)\s+(\w+)/gi,
      /(?:issue|problem|bug)\s+(?:with|in|on)\s+(\w+)/gi
    ];

    topicPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1] && match[1].length > 2) {
          topics.add(match[1].toLowerCase());
        }
      }
    });

    return Array.from(topics);
  }

  /**
   * Calculate semantic similarity between two texts
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const keywords1 = new Set(this.extractKeywords(text1));
    const keywords2 = new Set(this.extractKeywords(text2));

    if (keywords1.size === 0 || keywords2.size === 0) return 0;

    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);

    // Jaccard similarity
    return intersection.size / union.size;
  }

  /**
   * Calculate topic overlap between two content items
   */
  private calculateTopicOverlap(topics1: string[], topics2: string[]): number {
    const set1 = new Set(topics1);
    const set2 = new Set(topics2);

    if (set1.size === 0 || set2.size === 0) return 0;

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Determine relationship type based on content analysis
   */
  private determineRelationshipType(
    item1: ContentItem,
    item2: ContentItem,
    similarity: number,
    topicOverlap: number
  ): ContextRelationship['relationshipType'] {
    // Check for explicit references
    if (item1.content.toLowerCase().includes(item2.title.toLowerCase()) ||
        item2.content.toLowerCase().includes(item1.title.toLowerCase())) {
      return 'references';
    }

    // Check for dependency patterns
    const dependencyPatterns = [
      /(?:depends on|requires|needs|based on|built on)/i,
      /(?:prerequisite|dependency|requirement)/i
    ];

    for (const pattern of dependencyPatterns) {
      if (pattern.test(item1.content) || pattern.test(item2.content)) {
        return 'depends-on';
      }
    }

    // Check for derivation patterns
    const derivationPatterns = [
      /(?:derived from|based on|inspired by|adapted from)/i,
      /(?:version of|variant of|extension of)/i
    ];

    for (const pattern of derivationPatterns) {
      if (pattern.test(item1.content) || pattern.test(item2.content)) {
        return 'derived-from';
      }
    }

    // High topic overlap suggests strong relationship
    if (topicOverlap > 0.6) {
      return 'similar';
    }

    // Default to related for moderate similarity
    return 'related';
  }

  /**
   * Analyze content and find relationships
   */
  public analyzeContent(items: ContentItem[]): ContextAnalysisResult {
    const relationships: ContextRelationship[] = [];
    const suggestions: ContextSuggestion[] = [];
    const allTopics = new Set<string>();
    const allKeywords = new Set<string>();

    // Update content cache
    items.forEach(item => {
      this.contentCache.set(item.id, item);
    });

    // Analyze each pair of items
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const item1 = items[i];
        const item2 = items[j];

        // Extract topics and keywords
        const topics1 = this.extractTopics(item1.content, item1.tags);
        const topics2 = this.extractTopics(item2.content, item2.tags);
        const keywords1 = this.extractKeywords(item1.content);
        const keywords2 = this.extractKeywords(item2.content);

        // Add to global sets
        topics1.forEach(topic => allTopics.add(topic));
        topics2.forEach(topic => allTopics.add(topic));
        keywords1.forEach(keyword => allKeywords.add(keyword));
        keywords2.forEach(keyword => allKeywords.add(keyword));

        // Calculate similarities
        const textSimilarity = this.calculateSimilarity(item1.content, item2.content);
        const topicOverlap = this.calculateTopicOverlap(topics1, topics2);
        const tagOverlap = this.calculateTopicOverlap(item1.tags, item2.tags);

        // Combined similarity score
        const combinedSimilarity = (textSimilarity * 0.5) + (topicOverlap * 0.3) + (tagOverlap * 0.2);

        // Create relationship if similarity is above threshold
        if (combinedSimilarity > 0.2) {
          const relationshipType = this.determineRelationshipType(
            item1, item2, textSimilarity, topicOverlap
          );

          const relationship: ContextRelationship = {
            id: `rel-${item1.id}-${item2.id}`,
            fromId: item1.id,
            toId: item2.id,
            fromType: item1.type,
            toType: item2.type,
            relationshipType,
            strength: combinedSimilarity,
            metadata: {
              keywords: [...new Set([...keywords1, ...keywords2])].slice(0, 5),
              topics: [...new Set([...topics1, ...topics2])].slice(0, 3),
              lastAnalyzed: new Date().toISOString()
            },
            createdAt: new Date().toISOString()
          };

          relationships.push(relationship);

          // Generate suggestions for strong relationships
          if (combinedSimilarity > 0.5) {
            suggestions.push({
              id: `suggestion-${item1.id}-${item2.id}`,
              targetId: item1.id,
              targetType: item1.type,
              suggestedId: item2.id,
              suggestedType: item2.type,
              reason: `High ${relationshipType} similarity (${Math.round(combinedSimilarity * 100)}%)`,
              confidence: combinedSimilarity,
              actionType: 'link'
            });
          }
        }
      }
    }

    // Store relationships
    this.relationships = relationships;

    return {
      relationships,
      suggestions,
      topics: Array.from(allTopics),
      keywords: Array.from(allKeywords),
      confidence: relationships.length > 0 ? 
        relationships.reduce((sum, rel) => sum + rel.strength, 0) / relationships.length : 0
    };
  }

  /**
   * Get related items for a specific item
   */
  public getRelatedItems(itemId: string, maxResults: number = 5): ContentItem[] {
    const relatedIds = new Set<string>();
    const scores = new Map<string, number>();

    // Find all relationships involving this item
    this.relationships.forEach(rel => {
      if (rel.fromId === itemId) {
        relatedIds.add(rel.toId);
        scores.set(rel.toId, (scores.get(rel.toId) || 0) + rel.strength);
      } else if (rel.toId === itemId) {
        relatedIds.add(rel.fromId);
        scores.set(rel.fromId, (scores.get(rel.fromId) || 0) + rel.strength);
      }
    });

    // Sort by relevance score and return top results
    return Array.from(relatedIds)
      .map(id => ({ id, score: scores.get(id) || 0, item: this.contentCache.get(id) }))
      .filter(({ item }) => item !== undefined)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(({ item }) => item!);
  }

  /**
   * Suggest actions based on content analysis
   */
  public suggestActions(itemId: string): ContextSuggestion[] {
    const item = this.contentCache.get(itemId);
    if (!item) return [];

    const suggestions: ContextSuggestion[] = [];
    const relatedItems = this.getRelatedItems(itemId);

    // Suggest linking to highly related items
    relatedItems.forEach(relatedItem => {
      const relationship = this.relationships.find(rel => 
        (rel.fromId === itemId && rel.toId === relatedItem.id) ||
        (rel.toId === itemId && rel.fromId === relatedItem.id)
      );

      if (relationship && relationship.strength > 0.4) {
        suggestions.push({
          id: `action-link-${itemId}-${relatedItem.id}`,
          targetId: itemId,
          targetType: item.type,
          suggestedId: relatedItem.id,
          suggestedType: relatedItem.type,
          reason: `Consider linking to related ${relatedItem.type}: "${relatedItem.title}"`,
          confidence: relationship.strength,
          actionType: 'link'
        });
      }
    });

    // Suggest transformations based on content patterns
    if (item.type === 'chat' && item.content.includes('task') || item.content.includes('todo')) {
      suggestions.push({
        id: `action-transform-${itemId}`,
        targetId: itemId,
        targetType: item.type,
        suggestedId: itemId,
        suggestedType: 'task',
        reason: 'This conversation contains actionable items that could be converted to tasks',
        confidence: 0.7,
        actionType: 'transform'
      });
    }

    if (item.type === 'note' && item.content.length > 1000) {
      suggestions.push({
        id: `action-summarize-${itemId}`,
        targetId: itemId,
        targetType: item.type,
        suggestedId: itemId,
        suggestedType: item.type,
        reason: 'This note is quite long and might benefit from a summary',
        confidence: 0.6,
        actionType: 'reference'
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get content clusters based on topic similarity
   */
  public getContentClusters(items: ContentItem[]): Array<{ topic: string; items: ContentItem[] }> {
    const topicGroups = new Map<string, ContentItem[]>();

    items.forEach(item => {
      const topics = this.extractTopics(item.content, item.tags);
      
      if (topics.length === 0) {
        // Add to 'uncategorized' if no topics found
        const uncategorized = topicGroups.get('uncategorized') || [];
        uncategorized.push(item);
        topicGroups.set('uncategorized', uncategorized);
      } else {
        // Add to each topic group
        topics.forEach(topic => {
          const group = topicGroups.get(topic) || [];
          group.push(item);
          topicGroups.set(topic, group);
        });
      }
    });

    // Convert to array and sort by group size
    return Array.from(topicGroups.entries())
      .map(([topic, items]) => ({ topic, items }))
      .sort((a, b) => b.items.length - a.items.length);
  }

  /**
   * Update relationships when content changes
   */
  public updateRelationships(updatedItem: ContentItem): ContextAnalysisResult {
    // Remove existing relationships for this item
    this.relationships = this.relationships.filter(rel => 
      rel.fromId !== updatedItem.id && rel.toId !== updatedItem.id
    );

    // Update cache
    this.contentCache.set(updatedItem.id, updatedItem);

    // Re-analyze with all cached items
    const allItems = Array.from(this.contentCache.values());
    return this.analyzeContent(allItems);
  }

  /**
   * Get relationship strength between two items
   */
  public getRelationshipStrength(itemId1: string, itemId2: string): number {
    const relationship = this.relationships.find(rel => 
      (rel.fromId === itemId1 && rel.toId === itemId2) ||
      (rel.toId === itemId1 && rel.fromId === itemId2)
    );

    return relationship ? relationship.strength : 0;
  }

  /**
   * Export relationships for external use
   */
  public exportRelationships(): ContextRelationship[] {
    return [...this.relationships];
  }

  /**
   * Import relationships from external source
   */
  public importRelationships(relationships: ContextRelationship[]): void {
    this.relationships = relationships;
  }
}

// Singleton instance
export const contextEngine = new SmartContextEngine();

// Utility functions for converting between types
export function itemToContentItem(item: Item): ContentItem {
  return {
    id: item.id,
    type: item.type === 'chat_session' ? 'chat' : item.type as ContentItem['type'],
    title: item.name,
    content: item.content || '',
    tags: item.tags || [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

export function chatSessionToContentItem(session: ChatSession): ContentItem {
  const content = session.messages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  return {
    id: session.id,
    type: 'chat',
    title: session.title,
    content,
    tags: session.tags || [],
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

export function taskToContentItem(task: TaskItem): ContentItem {
  return {
    id: task.id,
    type: 'task',
    title: task.title,
    content: task.description || '',
    tags: task.tags || [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

export function noteToContentItem(note: Note): ContentItem {
  const content = note.blocks
    .map((block: Block) => block.content)
    .join('\n');

  return {
    id: note.id,
    type: 'note',
    title: note.title,
    content,
    tags: note.tags || [],
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  };
}