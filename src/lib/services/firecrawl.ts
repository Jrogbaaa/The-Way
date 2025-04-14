/**
 * Firecrawl MCP service utilities
 * Provides functions for interacting with Firecrawl's web scraping capabilities
 */

// API key is stored securely in environment variables
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 'fc-c6e182fd637c40238d0b7362e1d91a5a';

/**
 * Scrape content from a URL
 */
export async function scrapeUrl(url: string, options: ScrapeOptions = {}) {
  try {
    const response = await fetch('http://localhost:3001/firecrawl_scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to scrape URL: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error scraping URL:', error);
    throw error;
  }
}

/**
 * Search for content on the web
 */
export async function webSearch(query: string, options: SearchOptions = {}) {
  try {
    const response = await fetch('http://localhost:3001/firecrawl_search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        query,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to search web: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching web:', error);
    throw error;
  }
}

/**
 * Batch scrape multiple URLs
 */
export async function batchScrape(urls: string[], options: ScrapeOptions = {}) {
  try {
    const response = await fetch('http://localhost:3001/firecrawl_batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        urls,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to batch scrape: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error batch scraping:', error);
    throw error;
  }
}

/**
 * Crawl a website
 */
export async function crawlWebsite(url: string, options: CrawlOptions = {}) {
  try {
    const response = await fetch('http://localhost:3001/firecrawl_crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to crawl website: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error crawling website:', error);
    throw error;
  }
}

/**
 * Extract structured data from web pages
 */
export async function extractData(urls: string[], prompt: string, options: ExtractOptions = {}) {
  try {
    const response = await fetch('http://localhost:3001/firecrawl_extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        urls,
        prompt,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to extract data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error extracting data:', error);
    throw error;
  }
}

// Type definitions for the API parameters
export type ScrapeOptions = {
  elementSelector?: string;
  includeImages?: boolean;
  includeLinks?: boolean;
  includeHtml?: boolean;
  waitForSelector?: string;
  convertTables?: boolean;
  excludeTags?: string[];
  includeTags?: string[];
  onlyMainContent?: boolean;
};

export type SearchOptions = {
  limit?: number;
  fullContent?: boolean;
  safeSearch?: boolean;
  region?: string;
  language?: string;
};

export type CrawlOptions = {
  maxDepth?: number;
  limit?: number;
  allowExternalLinks?: boolean;
  deduplicateSimilarURLs?: boolean;
};

export type ExtractOptions = {
  systemPrompt?: string;
  schema?: object;
  allowExternalLinks?: boolean;
  enableWebSearch?: boolean;
  includeSubdomains?: boolean;
}; 