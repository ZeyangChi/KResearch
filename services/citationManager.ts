import { Citation } from '../types';

/**
 * 数字引文管理系统
 * 负责引文的编号分配、去重、格式化和正文标记生成
 */
export class CitationManager {
    private citations: Map<string, Citation> = new Map();
    private citationCounter: number = 1;

    constructor() {
        console.log('[Citation Manager] Initialized');
    }

    /**
     * 添加引文并返回其编号
     * 如果引文已存在（基于URL），返回现有编号
     */
    addCitation(citation: Citation): number {
        const key = this.getCitationKey(citation);
        
        if (this.citations.has(key)) {
            return this.citations.get(key)!.id!;
        }

        // 创建新的引文记录
        const newCitation: Citation = {
            ...citation,
            id: this.citationCounter++,
            accessDate: citation.accessDate || new Date().toISOString().split('T')[0],
            timesCited: 0
        };

        this.citations.set(key, newCitation);
        console.log(`[Citation Manager] Added citation ${newCitation.id}: ${citation.title}`);
        
        return newCitation.id!;
    }

    /**
     * 批量添加引文
     */
    addCitations(citations: Citation[]): number[] {
        return citations.map(citation => this.addCitation(citation));
    }

    /**
     * 记录引文使用情况
     */
    recordCitationUsage(citationIds: number[]): void {
        for (const id of citationIds) {
            const citation = this.getCitationById(id);
            if (citation) {
                citation.timesCited = (citation.timesCited || 0) + 1;
            }
        }
    }

    /**
     * 生成正文中的数字引文标记
     */
    generateInTextCitation(citationId: number): string {
        this.recordCitationUsage([citationId]);
        return `[${citationId}]`;
    }

    /**
     * 生成多个引文的正文标记
     */
    generateMultipleInTextCitations(citationIds: number[]): string {
        if (citationIds.length === 0) return '';
        this.recordCitationUsage(citationIds);
        if (citationIds.length === 1) return `[${citationIds[0]}]`;
        
        // 排序并合并连续的引文编号
        const sortedIds = [...citationIds].sort((a, b) => a - b);
        const ranges: string[] = [];
        let start = sortedIds[0];
        let end = start;

        for (let i = 1; i < sortedIds.length; i++) {
            if (sortedIds[i] === end + 1) {
                end = sortedIds[i];
            } else {
                ranges.push(start === end ? `${start}` : `${start}-${end}`);
                start = end = sortedIds[i];
            }
        }
        ranges.push(start === end ? `${start}` : `${start}-${end}`);

        return `[${ranges.join(', ')}]`;
    }

    /**
     * 获取引文通过ID
     */
    getCitationById(id: number): Citation | undefined {
        for (const citation of this.citations.values()) {
            if (citation.id === id) {
                return citation;
            }
        }
        return undefined;
    }

    /**
     * 获取所有引文，按编号排序
     */
    getAllCitations(): Citation[] {
        const citations = Array.from(this.citations.values());
        return citations.sort((a, b) => (a.id || 0) - (b.id || 0));
    }

    /**
     * 获取所有被引用的引文
     */
    getCitedCitations(): Citation[] {
        return this.getAllCitations().filter(c => (c.timesCited || 0) > 0);
    }

    /**
     * 获取所有未被引用的引文
     */
    getUncitedCitations(): Citation[] {
        return this.getAllCitations().filter(c => (c.timesCited || 0) === 0);
    }

    /**
     * 获取引文统计数据
     */
    getStats(): { total: number; cited: number; uncited: number } {
        const all = this.getAllCitations();
        const cited = all.filter(c => (c.timesCited || 0) > 0);
        return {
            total: all.length,
            cited: cited.length,
            uncited: all.length - cited.length,
        };
    }

    /**
     * 清除所有引文
     */
    clear(): void {
        this.citations.clear();
        this.citationCounter = 1;
        console.log('[Citation Manager] All citations cleared');
    }


    // 私有辅助方法

    private getCitationKey(citation: Citation): string {
        return this.normalizeUrl(citation.url);
    }

    private normalizeUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            // 移除查询参数和片段，标准化域名
            return `${urlObj.protocol}//${urlObj.hostname.toLowerCase()}${urlObj.pathname}`;
        } catch {
            return url.toLowerCase().trim();
        }
    }

}

/**
 * 引文文本处理工具类
 */
export class CitationTextProcessor {
    private citationManager: CitationManager;

    constructor(citationManager: CitationManager) {
        this.citationManager = citationManager;
    }

    /**
     * 在文本中插入引文标记
     * 查找文本中的引文提示并替换为数字标记
     */
    insertCitationMarks(text: string, citations: Citation[]): string {
        if (!citations || citations.length === 0) {
            return text;
        }

        let processedText = text;
        const citationIds: number[] = [];

        // 为每个引文分配编号
        for (const citation of citations) {
            const id = this.citationManager.addCitation(citation);
            citationIds.push(id);
        }

        // 在文本末尾添加引文标记
        if (citationIds.length > 0) {
            const citationMark = this.citationManager.generateMultipleInTextCitations(citationIds);
            processedText = processedText.trim() + ' ' + citationMark;
        }

        return processedText;
    }

    private parseCitationString(citationStr: string): number[] {
        const ids: number[] = [];
        const parts = citationStr.split(',');

        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                // 处理范围，如 "1-3"
                const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        ids.push(i);
                    }
                }
            } else {
                // 处理单个数字
                const id = parseInt(trimmed);
                if (!isNaN(id)) {
                    ids.push(id);
                }
            }
        }

        return ids;
    }
}

// 导出单例实例
export const citationManager = new CitationManager();
export const citationTextProcessor = new CitationTextProcessor(citationManager);
