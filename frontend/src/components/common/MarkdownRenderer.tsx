import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const htmlContent = useMemo(() => {
    try {
      // Configure marked for GFM and linebreaks
      return marked.parse(content, {
        async: false,
        breaks: true,
        gfm: true,
      }) as string;
    } catch (e) {
      console.error('[MarkdownRenderer] Parse error:', e);
      return content;
    }
  }, [content]);

  return (
    <div
      className={`markdown-body prose prose-slate prose-sm max-w-none text-slate-800 leading-relaxed font-sans ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
