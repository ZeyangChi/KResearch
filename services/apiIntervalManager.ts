import { ResearchMode, ApiIntervalConfig } from '../types';
import { settingsService } from './settingsService';

class ApiIntervalManager {
    private errorHistory: number[] = [];
    private readonly MAX_ERROR_HISTORY = 10;

    /**
     * 计算API调用间隔
     * @param mode 研究模式
     * @param config API间隔配置
     * @returns 计算后的延迟时间（毫秒）
     */
    calculateDelay(mode: ResearchMode, config?: ApiIntervalConfig): number {
        const intervalConfig = config || settingsService.getSettings().apiIntervalConfig;

        let baseDelay = intervalConfig.baseDelayMs;

        // 根据研究模式调整基础延迟
        switch (mode) {
            case 'DeepDive':
                baseDelay *= intervalConfig.deepDiveMultiplier;
                break;
            case 'Balanced':
                baseDelay *= intervalConfig.balancedMultiplier;
                break;
            case 'Quick':
                baseDelay *= intervalConfig.quickMultiplier;
                break;
        }

        // 如果启用动态调整，根据错误历史调整延迟
        if (intervalConfig.dynamicAdjustment) {
            const recentErrors = this.getRecentErrorCount();
            if (recentErrors >= intervalConfig.errorThreshold) {
                baseDelay *= intervalConfig.errorMultiplier;
                console.log(`[API Interval] Increased delay due to ${recentErrors} recent 429 errors`);
            }
        }

        // 应用最大延迟限制 (20秒)，确保用户体验不会过差
        const maxDelay = 20000;
        const finalDelay = Math.min(baseDelay, maxDelay);

        if (finalDelay < baseDelay) {
            console.log(`[API Interval] Delay capped at ${maxDelay}ms (was ${Math.round(baseDelay)}ms) for mode: ${mode}`);
        } else {
            console.log(`[API Interval] Calculated delay: ${finalDelay}ms for mode: ${mode}`);
        }

        return Math.round(finalDelay);
    }

    /**
     * 记录429错误
     */
    record429Error(): void {
        const now = Date.now();
        this.errorHistory.push(now);
        
        // 保持错误历史记录在合理范围内
        if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
            this.errorHistory.shift();
        }

        console.log(`[API Interval] Recorded 429 error. Total recent errors: ${this.getRecentErrorCount()}`);
    }

    /**
     * 获取最近5分钟内的错误数量
     */
    private getRecentErrorCount(): number {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        return this.errorHistory.filter(timestamp => timestamp > fiveMinutesAgo).length;
    }

    /**
     * 清除错误历史
     */
    clearErrorHistory(): void {
        this.errorHistory = [];
        console.log('[API Interval] Error history cleared');
    }

    /**
     * 获取错误统计信息
     */
    getErrorStats(): { total: number; recent: number } {
        return {
            total: this.errorHistory.length,
            recent: this.getRecentErrorCount()
        };
    }
}

export const apiIntervalManager = new ApiIntervalManager();
