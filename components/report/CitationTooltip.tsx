import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Citation } from '../../types';
import GlassCard from '../GlassCard';

interface CitationTooltipProps {
  citation: Citation;
  children: React.ReactNode;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const CitationTooltip: React.FC<CitationTooltipProps> = ({
  citation,
  children,
  isVisible,
  onVisibilityChange
}) => {
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0, placement: 'top' });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 计算工具提示的最佳位置
  const calculatePosition = (): TooltipPosition => {
    if (!triggerRef.current || !tooltipRef.current) {
      return { top: 0, left: 0, placement: 'top' };
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // 工具提示的尺寸
    const tooltipWidth = 320; // 预设宽度
    const tooltipHeight = tooltipRect.height || 150; // 预设高度
    const gap = 8; // 与触发元素的间距

    let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
    let top = 0;
    let left = 0;

    // 尝试在上方显示
    if (triggerRect.top - tooltipHeight - gap > 0) {
      placement = 'top';
      top = triggerRect.top + scrollY - tooltipHeight - gap;
      left = triggerRect.left + scrollX + (triggerRect.width - tooltipWidth) / 2;
    }
    // 尝试在下方显示
    else if (triggerRect.bottom + tooltipHeight + gap < viewportHeight) {
      placement = 'bottom';
      top = triggerRect.bottom + scrollY + gap;
      left = triggerRect.left + scrollX + (triggerRect.width - tooltipWidth) / 2;
    }
    // 尝试在右侧显示
    else if (triggerRect.right + tooltipWidth + gap < viewportWidth) {
      placement = 'right';
      top = triggerRect.top + scrollY + (triggerRect.height - tooltipHeight) / 2;
      left = triggerRect.right + scrollX + gap;
    }
    // 最后尝试在左侧显示
    else {
      placement = 'left';
      top = triggerRect.top + scrollY + (triggerRect.height - tooltipHeight) / 2;
      left = triggerRect.left + scrollX - tooltipWidth - gap;
    }

    // 确保不超出视窗边界
    left = Math.max(10, Math.min(left, viewportWidth - tooltipWidth - 10));
    top = Math.max(10, Math.min(top, viewportHeight - tooltipHeight - 10));

    return { top, left, placement };
  };

  // 处理鼠标进入
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      onVisibilityChange(true);
    }, 300); // 300ms延迟显示
  };

  // 处理鼠标离开
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      onVisibilityChange(false);
    }, 150); // 150ms延迟隐藏
  };

  // 更新位置
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const newPosition = calculatePosition();
      setPosition(newPosition);
    }
  }, [isVisible]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // 格式化引文信息
  const formatCitationInfo = () => {
    const parts = [];
    
    if (citation.authors) {
      parts.push(citation.authors);
    }
    
    if (citation.year) {
      parts.push(`(${citation.year})`);
    }
    
    return parts.join(' ');
  };

  // 获取域名
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className={`fixed z-[9999] w-80 transition-all duration-200 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <GlassCard className="p-4 shadow-lg">
        <div className="space-y-3">
          {/* 引文编号 */}
          {citation.id && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full">
                {citation.id}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">引文 #{citation.id}</span>
            </div>
          )}

          {/* 标题 */}
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">
            {citation.title}
          </h4>

          {/* 作者和年份 */}
          {formatCitationInfo() && (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {formatCitationInfo()}
            </p>
          )}

          {/* 来源 */}
          {citation.source && (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              {citation.source}
            </p>
          )}

          {/* URL域名 */}
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="truncate">{getDomain(citation.url)}</span>
          </div>

          {/* 访问日期 */}
          {citation.accessDate && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              访问日期: {citation.accessDate}
            </p>
          )}
        </div>

        {/* 箭头指示器 */}
        <div
          className={`absolute w-2 h-2 bg-card-bg-light dark:bg-glass-dark border-l border-t border-border-light dark:border-border-dark transform rotate-45 ${
            position.placement === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
            position.placement === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
            position.placement === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
            'left-[-4px] top-1/2 -translate-y-1/2'
          }`}
        />
      </GlassCard>
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </span>
      {createPortal(tooltipContent, document.body)}
    </>
  );
};

export default CitationTooltip;
