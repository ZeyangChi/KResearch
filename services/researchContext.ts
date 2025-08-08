import { ResearchMode } from '../types';

/**
 * 研究上下文管理器
 * 用于在API调用过程中跟踪当前的研究模式，以便进行智能间隔调整
 */
class ResearchContextManager {
    private currentMode: ResearchMode = 'Balanced';
    private contextStack: ResearchMode[] = [];

    /**
     * 设置当前研究模式
     */
    setMode(mode: ResearchMode): void {
        this.currentMode = mode;
        console.log(`[Research Context] Mode set to: ${mode}`);
    }

    /**
     * 获取当前研究模式
     */
    getCurrentMode(): ResearchMode {
        return this.currentMode;
    }

    /**
     * 推入新的研究模式到上下文栈
     * 用于嵌套调用场景
     */
    pushMode(mode: ResearchMode): void {
        this.contextStack.push(this.currentMode);
        this.currentMode = mode;
        console.log(`[Research Context] Pushed mode: ${mode}, stack depth: ${this.contextStack.length}`);
    }

    /**
     * 从上下文栈弹出研究模式
     */
    popMode(): ResearchMode {
        if (this.contextStack.length > 0) {
            const previousMode = this.currentMode;
            this.currentMode = this.contextStack.pop()!;
            console.log(`[Research Context] Popped mode, restored to: ${this.currentMode}`);
            return previousMode;
        }
        return this.currentMode;
    }

    /**
     * 清除上下文栈
     */
    clearStack(): void {
        this.contextStack = [];
        console.log('[Research Context] Context stack cleared');
    }

    /**
     * 获取上下文信息
     */
    getContextInfo(): { currentMode: ResearchMode; stackDepth: number } {
        return {
            currentMode: this.currentMode,
            stackDepth: this.contextStack.length
        };
    }
}

export const researchContext = new ResearchContextManager();
