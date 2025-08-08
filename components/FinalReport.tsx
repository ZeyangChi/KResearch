import React from 'react';
import { FinalResearchData, FileData, TranslationStyle } from '../types';
import ReportHeader from './report/ReportHeader';
import MarkdownRenderer from './report/MarkdownRenderer';
import ReportCitations from './report/ReportCitations';
import ReportSummary from './report/ReportSummary';
import ReportToolbox from './report/ReportToolbox';
import useCitationInteraction from '../hooks/useCitationInteraction';
import { citationManager } from '../services/citationManager';

interface FinalReportProps {
  data: FinalResearchData;
  onVisualize: (reportMarkdown: string) => void;
  isVisualizing: boolean;
  onRegenerate: () => void;
  isRegenerating: boolean;
  isRewriting: boolean;
  onRewrite: (instruction: string, file: FileData | null) => void;
  onNavigateVersion: (direction: 'prev' | 'next') => void;
  onTranslate: (language: string, style: TranslationStyle) => void;
  isTranslating: boolean;
}

const FinalReport: React.FC<FinalReportProps> = ({
  data, onVisualize, isVisualizing, onRegenerate, isRegenerating, isRewriting, onRewrite, onNavigateVersion,
  onTranslate, isTranslating
}) => {
  const { reports, activeReportIndex, citations, researchTimeMs, searchCycles } = data;
  const currentReport = reports[activeReportIndex];

  // 获取CitationManager中的引文数据
  const allCitations = citationManager.getAllCitations();

  // 初始化引文交互Hook
  const {
    hoveredCitationId,
    isScrolling,
    handleCitationClick,
    handleCitationHover
  } = useCitationInteraction({
    citations: allCitations,
    onCitationClick: (citationId: number) => {
      console.log(`Clicked citation ${citationId}`);
      // 可以在这里添加额外的点击处理逻辑，比如分析统计
    },
    onCitationHover: (citationId: number | null) => {
      // 可以在这里添加额外的悬停处理逻辑
      if (citationId) {
        console.log(`Hovering citation ${citationId}`);
      }
    }
  });
  
  return (
    <div className="flex gap-8">
      <div className="flex-grow w-0 text-gray-800 dark:text-gray-300">
        <ReportHeader
          report={currentReport}
          citations={citations}
          onVisualize={() => onVisualize(currentReport.content)}
          isVisualizing={isVisualizing}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
          isRewriting={isRewriting}
          isTranslating={isTranslating}
          onNavigateVersion={onNavigateVersion}
          reportCount={reports.length}
        />
        
        <MarkdownRenderer
          report={currentReport.content}
          citations={allCitations}
          onCitationClick={handleCitationClick}
        />

        <ReportSummary 
          researchTimeMs={researchTimeMs} 
          citationCount={citations.length} 
          searchCycleCount={searchCycles}
        />

        <ReportCitations citations={citations} />
      </div>
       <div className="flex-shrink-0 w-16 sticky top-8 self-start">
          <ReportToolbox 
            onRewrite={onRewrite} 
            isRewriting={isRewriting}
            onTranslate={onTranslate}
            isTranslating={isTranslating}
            isToolboxDisabled={isRegenerating || isRewriting || isTranslating || isVisualizing}
           />
      </div>
    </div>
  );
};

export default FinalReport;