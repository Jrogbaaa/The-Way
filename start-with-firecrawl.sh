#!/bin/bash

# Start Firecrawl MCP in the background
echo "Starting Firecrawl MCP server..."
export FIRECRAWL_API_KEY=fc-c6e182fd637c40238d0b7362e1d91a5a
npx -y firecrawl-mcp &

# Store the process ID to kill it later
FIRECRAWL_PID=$!

# Wait a moment for the server to start
sleep 3

# Start the Next.js application
echo "Starting Next.js application..."
cd the-way
npm run dev

# When Next.js is stopped, kill the Firecrawl MCP server
kill $FIRECRAWL_PID 