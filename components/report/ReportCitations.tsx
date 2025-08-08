import React from 'react';
import { Citation } from '../../types';
import { useLanguage } from '../../contextx/LanguageContext';
import { citationManager } from '../../services/citationManager';

interface ReportCitationsProps {
  citations: Citation[];
}

const CitationList: React.FC<{ title: string; citations: Citation[] }> = ({ title, citations }) => {
    const { t } = useLanguage();

    if (citations.length === 0) return null;

    const copyFormattedCitations = () => {
        const citationText = citations.map(c => `[${c.id}] ${c.title}\n${c.url}`).join('\n\n');
        navigator.clipboard.writeText(citationText).then(() => {
            alert(t('citationsCopied') || 'Citations copied to clipboard!');
        }, () => {
            alert(t('citationsCopyFailed') || 'Failed to copy citations.');
        });
    };

    return (
        <div className="mt-8 border-t border-border-light dark:border-border-dark pt-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold">{title}</h3>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {citations.length} {citations.length === 1 ? t('citation') || 'citation' : t('citations') || 'citations'}
                    </span>
                </div>
                <button
                    onClick={copyFormattedCitations}
                    className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300 hover:bg-blue-500/20 transition-colors"
                >
                    {t('copyCitations') || 'Copy Citations'}
                </button>
            </div>
            <div className="space-y-3">
                {citations.map((citation) => {
                    return (
                        <div
                            key={citation.id}
                            id={`citation-${citation.id}`}
                            className="group p-4 bg-glass-light dark:bg-glass-dark rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    {citation.id}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <a
                                        href={citation.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-gray-900 dark:text-gray-100 leading-relaxed hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                                    >
                                        {citation.title}
                                    </a>
                                    {(citation.authors || citation.year) && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {citation.authors}{citation.authors && citation.year ? ' • ' : ''}{citation.year}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const ReportCitations: React.FC<ReportCitationsProps> = ({ citations }) => {
  const { t } = useLanguage();

  const citedCitations = citationManager.getCitedCitations();
  const uncitedCitations = citationManager.getUncitedCitations();

  if (citations.length === 0) return null;

  return (
    <>
        <CitationList title={t('relatedReferences') || "Related References"} citations={citedCitations} />
        <CitationList title={t('otherReferences') || "Other References"} citations={uncitedCitations} />
    </>
  );
};

export default ReportCitations;
