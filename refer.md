# 引文管理系统分析

本文档旨在详细分析当前项目的引文管理系统，该系统经过重构，专注于简洁高效地处理和展示引文。

## 1. 系统概述

本引文管理系统旨在解决研究过程中的核心需求：收集文献、在报告中引用，并最终生成清晰的参考文献列表。

系统的核心设计思想是**双列表模式**：
- **相关参考文献 (Related References)**: 在研究报告正文中被明确引用的文献。
- **其余参考文献 (Other References)**: 在研究过程中收集但未在正文中直接引用的文献。

这种设计确保了报告的严谨性，同时保留了所有相关研究资料以供参考。系统移除了所有复杂的引文质量评估和多格式（APA、IEEE 等）输出功能，专注于提供一个带有直接链接的简洁列表。

## 2. 核心组件分析

系统由以下几个关键文件协同工作：

### a. `services/citationManager.ts` - 引文管理器

这是系统的逻辑中枢。`CitationManager` 类是一个单例，负责：

- **添加与去重**: 通过 `addCitation(citation)` 方法添加新的引文。它使用规范化的URL作为唯一键（`getCitationKey`），有效防止重复添加同一文献。
- **编号分配**: 为每条独一无二的引文分配一个从1开始的递增ID。
- **引用追踪**: 通过 `recordCitationUsage(citationIds)` 方法记录每条引文在正文中的使用次数。`timesCited` 属性是区分“相关”与“其余”引文的关键。
- **数据检索**:
    - `getCitedCitations()`: 返回所有 `timesCited > 0` 的引文，构成“相关参考文献”列表。
    - `getUncitedCitations()`: 返回所有 `timesCited === 0` 的引文，构成“其余参考文献”列表。
    - `getAllCitations()`: 获取所有已添加的引文。
- **正文标记生成**: `generateInTextCitation(id)` 和 `generateMultipleInTextCitations(ids)` 方法负责生成插入到报告正文中的数字标记，如 `[1]` 或 `[3-5, 7]`。

### b. `types.ts` - 数据结构

`Citation` 接口是核心的数据模型，定义了引文对象应包含的字段：

```typescript
export interface Citation {
  url: string;          // 必需，文献链接，也是去重的关键
  title: string;        // 必需，文献标题
  id?: number;          // 可选，由 citationManager 分配的唯一编号
  authors?: string;     // 可选，作者信息
  year?: string;        // 可选，发表年份
  source?: string;      // 可选，来源（如期刊名）
  accessDate?: string;  // 可选，访问日期
  timesCited?: number;  // 可选，被引用的次数，由 citationManager 维护
}
```

这个接口设计简洁，专注于引文的基本信息和引用追踪。

### c. `components/report/ReportCitations.tsx` - UI渲染

这个React组件负责将引文数据渲染到前端页面。

- **双列表渲染**: 组件内部调用 `citationManager.getCitedCitations()` 和 `citationManager.getUncitedCitations()` 分别获取两组数据。
- **`CitationList` 子组件**: `ReportCitations` 使用 `CitationList` 子组件来渲染每个列表，传入标题（如“相关参考文献”）和对应的引文数组。
- **简洁的UI呈现**:
    - 每个引文项都显示其编号、标题和作者/年份信息。
    - **标题是一个直接指向 `citation.url` 的超链接**，方便用户快速访问原文。
    - 移除了所有与格式化相关的复杂显示逻辑，界面干净直观。
- **复制功能**: 提供一个“复制引文”按钮，可以将当前列表的引文信息（标题和URL）以纯文本格式复制到剪贴板。

### d. `hooks/useCitationInteraction.ts` - 交互逻辑

这个自定义Hook提供了丰富的引文交互功能，增强了用户体验。

- **点击跳转**: `handleCitationClick(id)` 允许用户在报告正文中点击一个引文标记（如 `[1]`），页面会自动平滑滚动到下方参考文献列表中对应的条目，并短暂高亮显示。
- **悬停提示**: `handleCitationHover(id)` 配合 `CitationTooltip.tsx` 组件，当用户鼠标悬停在引文标记上时，会弹出一个信息丰富的悬浮窗，展示该引文的详细信息（标题、作者、来源等），无需滚动页面即可预览。

## 3. 数据流

1.  **收集**: 在研究阶段，系统通过各种服务（如 `search.ts`）收集到文献信息，并创建 `Citation` 对象。
2.  **注册**: 所有收集到的 `Citation` 对象都被送入 `citationManager.addCitation()` 进行注册，获得唯一ID并存入内部Map。
3.  **引用**: 当生成报告正文时，`citationTextProcessor.insertCitationMarks()` 将引文标记（如 `[1]`）插入文本，并调用 `citationManager.recordCitationUsage()` 来增加对应引文的 `timesCited` 计数。
4.  **渲染**:
    - `ReportCitations` 组件从 `citationManager` 获取已引用和未引用的文献列表。
    - 列表被传递给 `CitationList` 组件进行渲染。
    - `useCitationInteraction` Hook被用来处理页面上的点击和悬停事件，实现跳转和预览功能。

## 4. 结论

重构后的引文管理系统是一个职责清晰、高效简洁的解决方案。它成功地移除了不必要的复杂性，专注于核心功能，并通过优雅的交互设计提升了可用性。该系统完全满足了“双列表管理”和“提供直接链接”的核心需求。