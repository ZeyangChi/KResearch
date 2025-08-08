import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Citation } from '../../types';
import CitationTooltip from './CitationTooltip';

declare global {
  interface Window {
    mermaid?: any;
  }
}

interface MarkdownRendererProps {
  report: string;
  citations?: Citation[];
  onCitationClick?: (citationId: number) => void;
}

// CitationLink子组件
interface CitationLinkProps {
  citationIds: number[];
  citations: Citation[];
  onCitationClick?: (citationId: number) => void;
}

const CitationLink: React.FC<CitationLinkProps> = ({ citationIds, citations, onCitationClick }) => {
  const [hoveredCitationId, setHoveredCitationId] = useState<number | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onCitationClick && citationIds.length > 0) {
      onCitationClick(citationIds[0]); // 点击第一个引文ID
    }
  };

  const handleMouseEnter = (citationId: number) => {
    setHoveredCitationId(citationId);
  };

  const handleMouseLeave = () => {
    setHoveredCitationId(null);
  };

  // 获取悬停的引文对象
  const hoveredCitation = hoveredCitationId
    ? citations.find(c => c.id === hoveredCitationId)
    : null;

  return (
    <span
      className="inline-flex items-center gap-0 cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 font-medium"
      onClick={handleClick}
    >
      [
      {citationIds.map((id, index) => {
        const citation = citations.find(c => c.id === id);
        return (
          <React.Fragment key={id}>
            {citation ? (
              <CitationTooltip
                citation={citation}
                isVisible={hoveredCitationId === id}
                onVisibilityChange={(visible) => {
                  setHoveredCitationId(visible ? id : null);
                }}
              >
                <span
                  onMouseEnter={() => handleMouseEnter(id)}
                  onMouseLeave={handleMouseLeave}
                  className="hover:underline"
                >
                  {id}
                </span>
              </CitationTooltip>
            ) : (
              <span
                onMouseEnter={() => handleMouseEnter(id)}
                onMouseLeave={handleMouseLeave}
                className="hover:underline"
              >
                {id}
              </span>
            )}
            {index < citationIds.length - 1 && <span className="mx-0.5">,</span>}
          </React.Fragment>
        );
      })}
      ]
    </span>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ report, citations = [], onCitationClick }) => {
  useEffect(() => {
    if (report && window.mermaid) {
      const timer = setTimeout(async () => {
        try {
          const mermaidElements = document.querySelectorAll('.mermaid');
          if (mermaidElements.length) {
            mermaidElements.forEach(el => el.removeAttribute('data-processed'));
            // The mermaid.run() function can return a promise that rejects on parse error.
            // Awaiting it inside a try/catch prevents an unhandled rejection.
            await window.mermaid.run({ nodes: mermaidElements });
          }
        } catch(e) {
          // Now we catch the error properly. We can log it for debugging.
          // This prevents the [object Object] from appearing if some global handler was picking it up.
          console.error("Error rendering Mermaid graphs:", e);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [report]);

  // 解析引文标记的函数
  const parseCitationMarks = (text: string) => {
    const citationRegex = /\[(\d+(?:[-,]\s*\d+)*)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      // 添加引文标记前的文本
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // 解析引文ID
      const citationIdsStr = match[1];
      const citationIds: number[] = [];

      // 处理单个ID或范围ID (如 "1,2,3" 或 "1-3")
      const idParts = citationIdsStr.split(',');
      for (const part of idParts) {
        const trimmedPart = part.trim();
        if (trimmedPart.includes('-')) {
          // 处理范围 (如 "1-3")
          const [start, end] = trimmedPart.split('-').map(s => parseInt(s.trim()));
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              citationIds.push(i);
            }
          }
        } else {
          // 处理单个ID
          const id = parseInt(trimmedPart);
          if (!isNaN(id)) {
            citationIds.push(id);
          }
        }
      }

      // 添加CitationLink组件
      if (citationIds.length > 0) {
        parts.push(
          <CitationLink
            key={`citation-${match.index}`}
            citationIds={citationIds}
            citations={citations}
            onCitationClick={onCitationClick}
          />
        );
      }

      lastIndex = citationRegex.lastIndex;
    }

    // 添加剩余的文本
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 1 ? parts : text;
  };

  return (
    <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
          p: ({node, children, ...props}) => {
            // 处理段落中的引文标记
            const processedChildren = React.Children.map(children, (child) => {
              if (typeof child === 'string') {
                const parsed = parseCitationMarks(child);
                return Array.isArray(parsed) ? parsed : child;
              }
              return child;
            });
            return <p className="mb-4 leading-relaxed" {...props}>{processedChildren}</p>;
          },
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
          li: ({node, children, ...props}) => {
            // 处理列表项中的引文标记
            const processedChildren = React.Children.map(children, (child) => {
              if (typeof child === 'string') {
                const parsed = parseCitationMarks(child);
                return Array.isArray(parsed) ? parsed : child;
              }
              return child;
            });
            return <li {...props}>{processedChildren}</li>;
          },
          a: ({node, ...props}) => <a className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 hover:brightness-125 transition-all duration-300" target="_blank" rel="noopener noreferrer" {...props} />,
          strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-gray-100" {...props} />,
          pre: ({ node, children, ...props }) => {
            const codeNode = node?.children[0];
            if (codeNode && codeNode.type === 'element' && codeNode.tagName === 'code') {
              const className = (codeNode.properties?.className || []) as string[];
              const match = /language-(\w+)/.exec(className[0] || '');
              if (match && match[1] === 'mermaid') {
                const textNode = codeNode.children?.[0];
                if (textNode && textNode.type === 'text') {
                  return (
                    <div className="p-4 my-4 bg-glass-light dark:bg-glass-dark rounded-2xl flex justify-center items-center overflow-x-auto">
                      <div key={textNode.value} className="mermaid" style={{ minWidth: '100%', textAlign: 'center' }}>
                        {textNode.value}
                      </div>
                    </div>
                  );
                }
              }
            }
            return (
              <div className="my-4 bg-black/20 dark:bg-black/40 backdrop-blur-[25px] border border-border-light/50 dark:border-border-dark/50 rounded-2xl overflow-x-auto">
                  <pre className="!bg-transparent !p-4" {...props}>{children}</pre>
              </div>
            );
          },
        }}
      >
        {report}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
