import { SearchStrategyConfig, SearchQuery, SearchStrategyResult } from '../types';

/**
 * 搜索策略优化服务
 * 负责生成高质量的学术搜索查询，提升搜索结果的相关性和权威性
 */
export class SearchStrategy {
    private config: SearchStrategyConfig;
    
    // 学术关键词库
    private readonly academicKeywords = {
        research: ['research', 'study', 'investigation', 'analysis', 'examination'],
        methodology: ['methodology', 'approach', 'method', 'technique', 'framework'],
        findings: ['findings', 'results', 'outcomes', 'conclusions', 'evidence'],
        review: ['review', 'survey', 'overview', 'systematic review', 'meta-analysis'],
        theory: ['theory', 'theoretical', 'conceptual', 'model', 'framework'],
        empirical: ['empirical', 'experimental', 'quantitative', 'qualitative', 'data'],
        academic: ['academic', 'scholarly', 'peer-reviewed', 'journal', 'publication']
    };

    // 领域特定关键词
    private readonly domainKeywords = {
        technology: ['AI', 'machine learning', 'artificial intelligence', 'algorithm', 'computing'],
        science: ['scientific', 'experiment', 'hypothesis', 'laboratory', 'clinical'],
        business: ['business', 'management', 'strategy', 'market', 'economic'],
        social: ['social', 'society', 'cultural', 'behavioral', 'psychological'],
        medical: ['medical', 'health', 'clinical', 'patient', 'treatment'],
        education: ['education', 'learning', 'teaching', 'pedagogical', 'curriculum']
    };

    // 时间相关关键词
    private readonly timeKeywords = {
        recent: ['recent', 'latest', 'current', 'contemporary', 'modern'],
        trend: ['trend', 'emerging', 'developing', 'evolving', 'advancement'],
        future: ['future', 'prediction', 'forecast', 'projection', 'outlook']
    };

    constructor(config?: Partial<SearchStrategyConfig>) {
        this.config = {
            enableAcademicKeywords: true,
            enableTimeRangeFilter: true,
            timeRangeYears: 5,
            enableQueryDiversification: true,
            maxQueriesPerSearch: 5,
            academicKeywordWeight: 0.7,
            domainSpecificOptimization: true,
            ...config
        };
    }

    /**
     * 生成学术化查询
     */
    generateAcademicQueries(baseQuery: string, section?: string): SearchQuery[] {
        const queries: SearchQuery[] = [];
        
        // 原始查询（优先级最高）
        queries.push({
            original: baseQuery,
            enhanced: baseQuery,
            keywords: this.extractKeywords(baseQuery),
            priority: 1.0,
            type: 'general'
        });

        if (this.config.enableAcademicKeywords) {
            // 学术关键词增强查询
            const academicQuery = this.enhanceQueryWithKeywords(baseQuery, 'academic');
            queries.push({
                original: baseQuery,
                enhanced: academicQuery,
                keywords: this.extractKeywords(academicQuery),
                priority: 0.9,
                type: 'academic'
            });

            // 研究方法论查询
            const methodologyQuery = this.enhanceQueryWithKeywords(baseQuery, 'methodology');
            queries.push({
                original: baseQuery,
                enhanced: methodologyQuery,
                keywords: this.extractKeywords(methodologyQuery),
                priority: 0.8,
                type: 'academic'
            });
        }

        // 领域特定优化
        if (this.config.domainSpecificOptimization && section) {
            const domainQuery = this.optimizeForDomain(baseQuery, section);
            if (domainQuery !== baseQuery) {
                queries.push({
                    original: baseQuery,
                    enhanced: domainQuery,
                    keywords: this.extractKeywords(domainQuery),
                    priority: 0.85,
                    type: 'specific'
                });
            }
        }

        // 时间范围过滤
        if (this.config.enableTimeRangeFilter) {
            const timeFilteredQuery = this.filterByTimeRange(baseQuery, this.config.timeRangeYears);
            queries.push({
                original: baseQuery,
                enhanced: timeFilteredQuery,
                keywords: this.extractKeywords(timeFilteredQuery),
                timeRange: `${this.config.timeRangeYears} years`,
                priority: 0.75,
                type: 'academic'
            });
        }

        // 查询多样化
        if (this.config.enableQueryDiversification) {
            const diversifiedQueries = this.diversifyQueries(baseQuery);
            diversifiedQueries.forEach((query, index) => {
                queries.push({
                    original: baseQuery,
                    enhanced: query,
                    keywords: this.extractKeywords(query),
                    priority: 0.6 - (index * 0.1),
                    type: 'general'
                });
            });
        }

        // 按优先级排序并限制数量
        return queries
            .sort((a, b) => b.priority - a.priority)
            .slice(0, this.config.maxQueriesPerSearch);
    }

    /**
     * 添加学术关键词
     */
    enhanceQueryWithKeywords(query: string, category: keyof typeof this.academicKeywords): string {
        const keywords = this.academicKeywords[category];
        if (!keywords || keywords.length === 0) return query;

        // 选择最相关的关键词
        const selectedKeyword = this.selectBestKeyword(query, keywords);
        
        // 智能插入关键词
        if (query.toLowerCase().includes('how') || query.toLowerCase().includes('what')) {
            return `${selectedKeyword} on ${query}`;
        } else if (query.toLowerCase().includes('impact') || query.toLowerCase().includes('effect')) {
            return `${query} ${selectedKeyword}`;
        } else {
            return `${selectedKeyword} ${query}`;
        }
    }

    /**
     * 添加时间范围限制
     */
    filterByTimeRange(query: string, years: number): string {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - years;
        
        // 添加时间关键词
        const timeKeyword = this.timeKeywords.recent[0]; // 'recent'
        
        return `${timeKeyword} ${query} ${startYear}-${currentYear}`;
    }

    /**
     * 生成多样化查询
     */
    diversifyQueries(baseQuery: string): string[] {
        const diversified: string[] = [];
        
        // 同义词替换
        const synonymQuery = this.replaceSynonyms(baseQuery);
        if (synonymQuery !== baseQuery) {
            diversified.push(synonymQuery);
        }

        // 问题形式转换
        const questionQuery = this.convertToQuestion(baseQuery);
        if (questionQuery !== baseQuery) {
            diversified.push(questionQuery);
        }

        // 添加上下文
        const contextQuery = this.addContext(baseQuery);
        if (contextQuery !== baseQuery) {
            diversified.push(contextQuery);
        }

        return diversified.slice(0, 2); // 限制多样化查询数量
    }

    /**
     * 领域特定优化
     */
    private optimizeForDomain(query: string, section: string): string {
        const lowerSection = section.toLowerCase();
        
        // 检测领域
        let domain: keyof typeof this.domainKeywords | null = null;
        
        if (lowerSection.includes('technology') || lowerSection.includes('ai') || lowerSection.includes('tech')) {
            domain = 'technology';
        } else if (lowerSection.includes('business') || lowerSection.includes('market') || lowerSection.includes('economic')) {
            domain = 'business';
        } else if (lowerSection.includes('health') || lowerSection.includes('medical') || lowerSection.includes('clinical')) {
            domain = 'medical';
        } else if (lowerSection.includes('social') || lowerSection.includes('society') || lowerSection.includes('cultural')) {
            domain = 'social';
        } else if (lowerSection.includes('education') || lowerSection.includes('learning') || lowerSection.includes('teaching')) {
            domain = 'education';
        } else if (lowerSection.includes('science') || lowerSection.includes('research') || lowerSection.includes('experiment')) {
            domain = 'science';
        }

        if (domain && this.domainKeywords[domain]) {
            const domainKeyword = this.domainKeywords[domain][0];
            return `${domainKeyword} ${query}`;
        }

        return query;
    }

    /**
     * 提取关键词
     */
    private extractKeywords(query: string): string[] {
        // 简单的关键词提取（可以后续优化为更复杂的NLP处理）
        return query
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word));
    }

    /**
     * 选择最佳关键词
     */
    private selectBestKeyword(query: string, keywords: string[]): string {
        // 简单策略：选择第一个关键词
        // 可以后续优化为基于查询内容的智能选择
        return keywords[0];
    }

    /**
     * 同义词替换
     */
    private replaceSynonyms(query: string): string {
        const synonymMap: { [key: string]: string } = {
            'impact': 'effect',
            'influence': 'affect',
            'method': 'approach',
            'result': 'outcome',
            'study': 'research',
            'analysis': 'examination'
        };

        let result = query;
        Object.entries(synonymMap).forEach(([original, synonym]) => {
            if (result.toLowerCase().includes(original)) {
                result = result.replace(new RegExp(original, 'gi'), synonym);
            }
        });

        return result;
    }

    /**
     * 转换为问题形式
     */
    private convertToQuestion(query: string): string {
        if (query.includes('?')) return query;
        
        if (query.toLowerCase().includes('impact') || query.toLowerCase().includes('effect')) {
            return `What is the ${query}?`;
        } else if (query.toLowerCase().includes('method') || query.toLowerCase().includes('approach')) {
            return `How does ${query} work?`;
        } else {
            return `What are the key aspects of ${query}?`;
        }
    }

    /**
     * 添加上下文
     */
    private addContext(query: string): string {
        const contexts = ['implications', 'applications', 'challenges', 'opportunities', 'trends'];
        const randomContext = contexts[Math.floor(Math.random() * contexts.length)];
        return `${query} ${randomContext}`;
    }

    /**
     * 评估查询质量
     */
    evaluateQueryQuality(query: SearchQuery): number {
        let score = 0.5; // 基础分数

        // 学术关键词加分
        const academicKeywords = Object.values(this.academicKeywords).flat();
        const hasAcademicKeywords = query.keywords.some(keyword => 
            academicKeywords.some(ak => ak.toLowerCase().includes(keyword.toLowerCase()))
        );
        if (hasAcademicKeywords) score += 0.2;

        // 时间范围加分
        if (query.timeRange) score += 0.15;

        // 查询长度适中加分
        if (query.enhanced.split(' ').length >= 3 && query.enhanced.split(' ').length <= 8) {
            score += 0.1;
        }

        // 特定类型加分
        if (query.type === 'academic') score += 0.1;
        if (query.type === 'specific') score += 0.05;

        return Math.min(score, 1.0);
    }

    /**
     * 生成搜索策略结果
     */
    generateSearchStrategy(baseQuery: string, section?: string): SearchStrategyResult {
        const queries = this.generateAcademicQueries(baseQuery, section);
        
        // 计算平均质量分数
        const totalQuality = queries.reduce((sum, query) => sum + this.evaluateQueryQuality(query), 0);
        const averageQuality = totalQuality / queries.length;

        // 记录应用的优化
        const optimizationApplied: string[] = [];
        if (this.config.enableAcademicKeywords) optimizationApplied.push('Academic Keywords');
        if (this.config.enableTimeRangeFilter) optimizationApplied.push('Time Range Filter');
        if (this.config.enableQueryDiversification) optimizationApplied.push('Query Diversification');
        if (this.config.domainSpecificOptimization) optimizationApplied.push('Domain Optimization');

        return {
            queries,
            totalQueries: queries.length,
            estimatedQuality: averageQuality,
            optimizationApplied
        };
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<SearchStrategyConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * 获取当前配置
     */
    getConfig(): SearchStrategyConfig {
        return { ...this.config };
    }
}

// 导出默认实例
export const searchStrategy = new SearchStrategy();
