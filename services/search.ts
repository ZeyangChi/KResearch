import { GenerateContentResponse } from "@google/genai";
import { ai } from './geminiClient';
import { getModel } from './models';
import { Citation, ResearchMode } from '../types';
import { researchContext } from './researchContext';

/**
 * 高级去重：合并相似域名的引文
 */
const advancedDeduplication = (citations: Citation[]): Citation[] => {
    const domainGroups = new Map<string, Citation[]>();

    // 按域名分组
    citations.forEach(citation => {
        try {
            const url = new URL(citation.url);
            const domain = url.hostname.toLowerCase().replace(/^www\./, '');

            if (!domainGroups.has(domain)) {
                domainGroups.set(domain, []);
            }
            domainGroups.get(domain)!.push(citation);
        } catch (error) {
            // 无效URL，单独处理
            const invalidDomain = `invalid_${citation.url}`;
            domainGroups.set(invalidDomain, [citation]);
        }
    });

    // 每个域名最多保留2个最好的引文
    const deduplicatedCitations: Citation[] = [];
    domainGroups.forEach((domainCitations) => {
        if (domainCitations.length === 1) {
            deduplicatedCitations.push(domainCitations[0]);
        } else {
            // 按标题长度和内容质量排序，选择最好的2个
            const sortedDomainCitations = domainCitations.sort((a, b) => {
                const aScore = (a.title?.length || 0) + (a.url.includes('https') ? 10 : 0);
                const bScore = (b.title?.length || 0) + (b.url.includes('https') ? 10 : 0);
                return bScore - aScore;
            });

            deduplicatedCitations.push(...sortedDomainCitations.slice(0, 2));
        }
    });

    return deduplicatedCitations;
};

/**
 * 数量平衡：保持合理的引文数量
 */
const balanceResultCount = (citations: Citation[]): Citation[] => {
    const minCount = 5;
    const maxCount = 15;
    const idealCount = 10;

    if (citations.length <= minCount) {
        return citations; // 太少了，全部保留
    } else if (citations.length <= maxCount) {
        return citations; // 数量合适，全部保留
    } else {
        // 太多了，选择最好的
        return citations.slice(0, idealCount);
    }
};

export const executeSingleSearch = async (
    searchQuery: string,
    mode: ResearchMode,
    signal?: AbortSignal,
    academicOutline?: string | null,
    targetSection?: string | null
): Promise<{ text: string, citations: Citation[] }> => {
    // 设置研究上下文
    researchContext.setMode(mode);
    
    const prompt = academicOutline && targetSection
        ? `
Please conduct a deep academic search and analysis for the query "${searchQuery}".
This search is intended to gather information for the "${targetSection}" section of a larger academic review paper.

**Academic Outline Context:**
<ACADEMIC_OUTLINE>
${academicOutline}
</ACADEMIC_OUTLINE>

**Requirements:**
1.  **Focus**: Prioritize academic literature, research papers, peer-reviewed articles, and official reports from reputable institutions.
2.  **Content Depth**: Provide detailed background information, theoretical underpinnings, empirical data, and established findings.
3.  **Expert Opinions**: Include relevant expert commentary, different schools of thought, and critical perspectives.
4.  **Authoritativeness**: Ensure the information's authority and academic value.
5.  **Comprehensive Summary**: Each search result must yield a detailed summary of at least 500 words.

**Output Format:**
- Detailed academic background and context.
- Explanation of key theories and concepts.
- Summary of relevant research findings and data.
- Expert opinions and authoritative quotes.
- Analysis of practical applications and impacts.
`
        : `Concisely summarize key information for the query: "${searchQuery}"`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: getModel('searcher', mode),
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
    }, signal);

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const rawCitations: Citation[] = groundingMetadata
        ? groundingMetadata.map((chunk: any) => ({
              url: chunk.web.uri,
              title: chunk.web.title || chunk.web.uri,
          }))
        : [];

    // 基础去重
    const uniqueCitations = Array.from(new Map(rawCitations.map(c => [c.url, c])).values());

    // 质量评估功能已移除，直接返回去重后的引文
    return { text: `Summary for "${searchQuery}": ${response.text}`, citations: uniqueCitations };
};