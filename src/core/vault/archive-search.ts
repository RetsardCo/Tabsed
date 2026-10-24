import { SavedTabItem } from '../../ui/types';

export interface SearchResultMatch {
  item: SavedTabItem;
  score: number;
  snippet: string;
  matchedFields: ('title' | 'url' | 'domain' | 'notes' | 'tags' | 'content')[];
}

export interface ArchiveSearchFilter {
  collectionId?: string;
  domain?: string;
  startDate?: string;
  endDate?: string;
  itemType?: 'tab' | 'session' | 'snapshot';
}

export class ArchiveSearchEngine {
  /**
   * Search saved tab items and their full-text archive content (PRD Epic 3.3)
   */
  public static search(
    items: SavedTabItem[],
    query: string,
    filter?: ArchiveSearchFilter
  ): SearchResultMatch[] {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return [];

    const terms = trimmedQuery.split(/\s+/).filter(Boolean);
    const results: SearchResultMatch[] = [];

    for (const item of items) {
      if (item.deletedAt) continue;

      // Apply filters
      if (filter?.collectionId && !item.collectionIds.includes(filter.collectionId)) {
        continue;
      }
      if (filter?.domain && item.domain.toLowerCase() !== filter.domain.toLowerCase()) {
        continue;
      }
      if (filter?.itemType && item.itemType !== filter.itemType) {
        continue;
      }
      if (filter?.startDate && new Date(item.savedAt) < new Date(filter.startDate)) {
        continue;
      }
      if (filter?.endDate && new Date(item.savedAt) > new Date(filter.endDate)) {
        continue;
      }

      let score = 0;
      const matchedFields: ('title' | 'url' | 'domain' | 'notes' | 'tags' | 'content')[] = [];
      let foundSnippet = '';

      const titleLower = item.title.toLowerCase();
      const urlLower = item.url.toLowerCase();
      const domainLower = item.domain.toLowerCase();
      const notesLower = (item.notes || '').toLowerCase();
      const tagsLower = (item.tags || []).map((t: string) => t.toLowerCase());
      const contentLower = (item.archiveContent || '').toLowerCase();

      // Check all terms
      const matchesAllTerms = terms.every((term: string) => {
        let termMatched = false;

        if (titleLower.includes(term)) {
          score += 15;
          termMatched = true;
          if (!matchedFields.includes('title')) matchedFields.push('title');
        }
        if (urlLower.includes(term)) {
          score += 8;
          termMatched = true;
          if (!matchedFields.includes('url')) matchedFields.push('url');
        }
        if (domainLower.includes(term)) {
          score += 6;
          termMatched = true;
          if (!matchedFields.includes('domain')) matchedFields.push('domain');
        }
        if (notesLower.includes(term)) {
          score += 10;
          termMatched = true;
          if (!matchedFields.includes('notes')) matchedFields.push('notes');
          if (!foundSnippet) {
            foundSnippet = this.extractContextSnippet(item.notes, term);
          }
        }
        if (tagsLower.some((t: string) => t.includes(term))) {
          score += 12;
          termMatched = true;
          if (!matchedFields.includes('tags')) matchedFields.push('tags');
        }
        if (contentLower.includes(term)) {
          score += 5;
          termMatched = true;
          if (!matchedFields.includes('content')) matchedFields.push('content');
          if (!foundSnippet && item.archiveContent) {
            foundSnippet = this.extractContextSnippet(item.archiveContent, term);
          }
        }

        return termMatched;
      });

      if (matchesAllTerms && score > 0) {
        if (!foundSnippet) {
          foundSnippet = item.notes || item.title;
        }

        results.push({
          item,
          score,
          snippet: foundSnippet,
          matchedFields
        });
      }
    }

    // Sort by descending relevance score
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Extracts a bounded snippet with surrounding words around the matching term
   */
  private static extractContextSnippet(text: string, term: string, maxChars = 140): string {
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(term.toLowerCase());
    if (index === -1) return text.slice(0, maxChars);

    const start = Math.max(0, index - Math.floor(maxChars / 3));
    const end = Math.min(text.length, start + maxChars);
    let snippet = text.slice(start, end).trim();

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }
}
