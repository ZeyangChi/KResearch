import { useState, useCallback, useRef, useEffect } from 'react';
import { Citation } from '../types';

interface UseCitationInteractionReturn {
  // 状态
  hoveredCitationId: number | null;
  isScrolling: boolean;
  
  // 事件处理函数
  handleCitationClick: (citationId: number) => void;
  handleCitationHover: (citationId: number | null) => void;
  
  // 工具函数
  scrollToCitation: (citationId: number) => Promise<boolean>;
  getCitationById: (citationId: number) => Citation | undefined;
}

interface UseCitationInteractionOptions {
  citations?: Citation[];
  onCitationClick?: (citationId: number) => void;
  onCitationHover?: (citationId: number | null) => void;
  scrollBehavior?: ScrollBehavior;
  scrollBlock?: ScrollLogicalPosition;
  debounceDelay?: number;
}

const useCitationInteraction = (
  options: UseCitationInteractionOptions = {}
): UseCitationInteractionReturn => {
  const {
    citations = [],
    onCitationClick,
    onCitationHover,
    scrollBehavior = 'smooth',
    scrollBlock = 'center',
    debounceDelay = 150
  } = options;

  // 状态管理
  const [hoveredCitationId, setHoveredCitationId] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // 防抖定时器引用
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 根据ID获取引文对象
  const getCitationById = useCallback((citationId: number): Citation | undefined => {
    return citations.find(citation => citation.id === citationId);
  }, [citations]);

  // 滚动到指定引文
  const scrollToCitation = useCallback(async (citationId: number): Promise<boolean> => {
    try {
      // 查找对应的引文元素
      const citationElement = document.getElementById(`citation-${citationId}`);
      
      if (!citationElement) {
        console.warn(`Citation element with ID "citation-${citationId}" not found`);
        return false;
      }

      // 设置滚动状态
      setIsScrolling(true);

      // 执行滚动
      citationElement.scrollIntoView({
        behavior: scrollBehavior,
        block: scrollBlock,
        inline: 'nearest'
      });

      // 添加高亮效果
      citationElement.classList.add('citation-highlight');
      
      // 清除之前的滚动超时
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // 设置滚动完成和高亮移除的定时器
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        citationElement.classList.remove('citation-highlight');
      }, 1000); // 1秒后移除高亮和滚动状态

      return true;
    } catch (error) {
      console.error('Error scrolling to citation:', error);
      setIsScrolling(false);
      return false;
    }
  }, [scrollBehavior, scrollBlock]);

  // 处理引文点击
  const handleCitationClick = useCallback((citationId: number) => {
    // 检查引文是否存在
    const citation = getCitationById(citationId);
    if (!citation) {
      console.warn(`Citation with ID ${citationId} not found`);
      return;
    }

    // 执行滚动
    scrollToCitation(citationId);

    // 调用外部回调
    if (onCitationClick) {
      onCitationClick(citationId);
    }
  }, [getCitationById, scrollToCitation, onCitationClick]);

  // 处理引文悬停（带防抖）
  const handleCitationHover = useCallback((citationId: number | null) => {
    // 清除之前的防抖定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // 如果是取消悬停，立即执行
    if (citationId === null) {
      setHoveredCitationId(null);
      if (onCitationHover) {
        onCitationHover(null);
      }
      return;
    }

    // 检查引文是否存在
    const citation = getCitationById(citationId);
    if (!citation) {
      console.warn(`Citation with ID ${citationId} not found`);
      return;
    }

    // 设置防抖延迟
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCitationId(citationId);
      if (onCitationHover) {
        onCitationHover(citationId);
      }
    }, debounceDelay);
  }, [getCitationById, onCitationHover, debounceDelay]);

  // 清理定时器
  const cleanup = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // 状态
    hoveredCitationId,
    isScrolling,
    
    // 事件处理函数
    handleCitationClick,
    handleCitationHover,
    
    // 工具函数
    scrollToCitation,
    getCitationById
  };
};

export default useCitationInteraction;
