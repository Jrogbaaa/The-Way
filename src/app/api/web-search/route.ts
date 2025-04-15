import { NextResponse } from 'next/server';
import { webSearch } from '@/lib/services/firecrawl';

export async function POST(request: Request) {
  try {
    const { query, limit = 5 } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }
    
    // Use Firecrawl MCP to search the web
    const searchResults = await webSearch(query, { limit });
    
    return NextResponse.json({
      results: searchResults,
      query,
      success: true
    });
    
  } catch (error) {
    console.error('Error performing web search:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 