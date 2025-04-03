'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ 
  content, 
  className 
}) => {
  return (
    <div className={cn("prose prose-indigo max-w-none", className)}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={tomorrow}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a: ({ node, ...props }) => (
            <a 
              {...props} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 hover:underline"
            />
          ),
          h1: ({ node, ...props }) => (
            <h1 {...props} className="text-2xl font-bold text-gray-900 mt-6 mb-4" />
          ),
          h2: ({ node, ...props }) => (
            <h2 {...props} className="text-xl font-semibold text-gray-800 mt-5 mb-3" />
          ),
          h3: ({ node, ...props }) => (
            <h3 {...props} className="text-lg font-medium text-gray-800 mt-4 mb-2" />
          ),
          p: ({ node, ...props }) => (
            <p {...props} className="text-gray-700 mb-4" />
          ),
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc pl-6 mb-4 text-gray-700" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal pl-6 mb-4 text-gray-700" />
          ),
          li: ({ node, ...props }) => (
            <li {...props} className="mb-1" />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote {...props} className="border-l-4 border-indigo-300 pl-4 italic text-gray-700 my-4" />
          ),
          hr: ({ node, ...props }) => (
            <hr {...props} className="my-6 border-gray-300" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent; 