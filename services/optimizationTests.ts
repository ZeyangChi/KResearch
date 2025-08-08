import { Citation } from '../types';
import { searchStrategy } from './searchStrategy';

/**
 * KResearch 优化功能综合测试套件
 */

// 测试数据
const testCitations: Citation[] = [
    {
        url: 'https://nature.com/articles/test1',
        title: 'Advanced Machine Learning Research Methods',
        authors: 'Smith, J. & Johnson, A.',
        year: '2023',
        source: 'Nature Machine Intelligence'
    },
    {
        url: 'https://ieee.org/papers/test2',
        title: 'Deep Learning Applications in Healthcare',
        authors: 'Brown, K.',
        year: '2022',
        source: 'IEEE Transactions on Medical Imaging'
    },
    {
        url: 'https://wikipedia.org/wiki/test3',
        title: 'Machine Learning Overview',
        authors: 'Various',
        year: '2024'
    },
    {
        url: 'https://stanford.edu/research/test4',
        title: 'Neural Network Architecture Study',
        authors: 'Davis, M.',
        year: '2021',
        source: 'Stanford AI Lab'
    },
    {
        url: 'https://blog.example.com/test5',
        title: 'AI Trends Blog Post',
        authors: 'Blogger, X.',
        year: '2024'
    }
];

/**
 * 测试搜索策略优化功能
 */
export function testSearchStrategyOptimization(): boolean {
    console.log('🧪 Testing Search Strategy Optimization...');
    
    try {
        // 测试学术查询生成
        const baseQuery = 'machine learning applications';
        const result = searchStrategy.generateSearchStrategy(baseQuery, 'technology');
        
        if (result.queries.length === 0) {
            console.error('❌ No queries generated');
            return false;
        }
        
        if (result.queries.length > 5) {
            console.error('❌ Too many queries generated:', result.queries.length);
            return false;
        }
        
        // 验证查询质量
        const hasAcademicKeywords = result.queries.some(q => 
            q.enhanced.toLowerCase().includes('research') || 
            q.enhanced.toLowerCase().includes('study') ||
            q.enhanced.toLowerCase().includes('analysis')
        );
        
        if (!hasAcademicKeywords) {
            console.error('❌ Generated queries lack academic keywords');
            return false;
        }
        
        // 验证优化应用
        if (result.optimizationApplied.length === 0) {
            console.error('❌ No optimizations were applied');
            return false;
        }
        
        console.log('✅ Search Strategy Optimization test passed');
        console.log(`   Generated ${result.queries.length} queries with quality score ${result.estimatedQuality.toFixed(2)}`);
        console.log(`   Applied optimizations: ${result.optimizationApplied.join(', ')}`);
        
        return true;
    } catch (error) {
        console.error('❌ Search Strategy Optimization test failed:', error);
        return false;
    }
}

/**
 * 测试配置和性能
 */
export function testConfigurationAndPerformance(): boolean {
    console.log('🧪 Testing Configuration and Performance...');
    
    try {
        // 测试搜索策略配置
        const originalConfig = searchStrategy.getConfig();
        
        searchStrategy.updateConfig({
            enableAcademicKeywords: false,
            maxQueriesPerSearch: 3
        });
        
        const result1 = searchStrategy.generateSearchStrategy('test query');
        
        if (result1.queries.length > 3) {
            console.error('❌ Configuration update failed - too many queries');
            return false;
        }
        
        // 恢复原始配置
        searchStrategy.updateConfig(originalConfig);
        
        console.log('✅ Configuration and Performance test passed');
        
        return true;
    } catch (error) {
        console.error('❌ Configuration and Performance test failed:', error);
        return false;
    }
}

/**
 * 运行所有优化测试
 */
export function runOptimizationTests(): boolean {
    console.log('🚀 Running KResearch Optimization Tests...\n');
    
    const tests = [
        testSearchStrategyOptimization,
        testConfigurationAndPerformance
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
        try {
            if (test()) {
                passedTests++;
            }
        } catch (error) {
            console.error('❌ Test failed with error:', error);
        }
        console.log(''); // 空行分隔
    }
    
    const totalTests = tests.length;
    const success = passedTests === totalTests;
    
    console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (success) {
        console.log('🎉 All optimization tests passed successfully!');
        console.log('✅ KResearch 优化功能验证完成');
    } else {
        console.log('❌ Some tests failed. Please check the implementation.');
    }
    
    return success;
}

// 导出测试运行器
export default runOptimizationTests;
