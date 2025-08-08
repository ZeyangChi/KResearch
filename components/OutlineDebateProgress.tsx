import React, { useRef, useEffect } from 'react';
import Spinner from './Spinner';
import { DebateUpdate, AgentPersona } from '../types';
import { useLanguage } from '../contextx/LanguageContext';

interface OutlineDebateProgressProps {
  debateUpdates: DebateUpdate[];
  isDebating: boolean;
}

const getAgentInfo = (persona: AgentPersona, t: (key: string) => string) => {
    switch (persona) {
        case 'Alpha':
            return {
                name: t('agentAlpha'),
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
            };
        case 'Beta':
            return {
                name: t('agentBeta'),
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
            };
    }
}

const OutlineDebateProgress: React.FC<OutlineDebateProgressProps> = ({ debateUpdates, isDebating }) => {
  const { t } = useLanguage();
  const headerText = isDebating ? '正在生成学术大纲...' : '学术大纲生成完成';
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
        logContainerRef.current.scrollTo({
            top: logContainerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [debateUpdates]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
        {isDebating && <Spinner />}
        <span>{headerText}</span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
        Alpha和Beta智能体正在协作设计学术论文结构
      </div>
      
      {debateUpdates.length > 0 && (
        <div ref={logContainerRef} className="max-h-[22rem] overflow-y-auto pr-4 -mr-4 space-y-1 scroll-smooth">
          <div className="relative pl-8">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border-light dark:bg-border-dark"></div>
            
            {debateUpdates.map((update) => (
              <div key={update.id} className="relative mb-4 animate-fade-in">
                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-glass-light dark:bg-glass-dark border-2 border-border-light dark:border-border-dark flex items-center justify-center -translate-x-1/2">
                  {getAgentInfo(update.persona, t).icon}
                </div>
                <div className="ml-2 p-3 rounded-2xl bg-glass-light/30 dark:bg-glass-dark/30 backdrop-blur-sm border border-border-light/20 dark:border-border-dark/20">
                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <div>
                      <span className={`font-semibold capitalize ${update.persona === 'Alpha' ? 'text-purple-500 dark:text-purple-400' : 'text-cyan-500 dark:text-cyan-400'}`}>
                        {getAgentInfo(update.persona, t).name}:
                      </span>
                      <span className="ml-1 italic">{update.thought}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutlineDebateProgress;
