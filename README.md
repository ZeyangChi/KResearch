# KResearch - 智能学术研究助手

> 基于双智能体协作的AI深度研究应用，专门生成符合学术标准的综述论文和深度研究报告

<!-- 徽章 -->
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css)
![Gemini](https://img.shields.io/badge/Google_Gemini-API-4285F4?style=flat-square&logo=google)

## 目录

- [项目介绍](#项目介绍)
  - [核心特性](#核心特性)
  - [技术栈](#技术栈)
- [快速开始](#快速开始)
  - [环境要求](#环境要求)
  - [安装步骤](#安装步骤)
- [使用指南](#使用指南)
  - [基本使用](#基本使用)
  - [学术模式](#学术模式)
- [Docker部署](#docker部署)
- [配置说明](#配置说明)
- [贡献指南](#贡献指南)
- [许可证](#许可证)
- [联系方式](#联系方式)
- [致谢](#致谢)

## 项目介绍

KResearch 是一款革命性的AI学术研究助手，采用独创的双智能体协作机制，专门为学者、研究人员和学生设计。它能够自动化执行深度研究流程，生成符合学术标准的高质量综述论文和研究报告。

### 🎯 核心特性

#### 🤖 双智能体协作系统
- **Alpha智能体（策略专家）**：负责整体研究策略规划和理论框架设计
- **Beta智能体（执行专家）**：专注于具体实施和细节完善
- **动态辩论机制**：两个智能体通过协作辩论确保研究的全面性和深度

#### 📚 学术综述论文生成
- **标准学术结构**：自动生成符合学术规范的论文结构（摘要、引言、文献综述、分析讨论、结论、参考文献）
- **8000字+深度内容**：确保内容的学术深度和完整性
- **APA引用格式**：规范的学术引用和参考文献管理
- **防跑题机制**：通过学术大纲约束确保内容聚焦

#### 🔄 智能研究流程
1. **澄清阶段**：通过对话精确理解研究需求
2. **学术大纲生成**：双智能体协作设计论文结构
3. **迭代深度研究**：多轮搜索和分析收集学术资料
4. **综合报告生成**：基于学术大纲生成高质量论文

#### 🎨 现代化用户界面
- **实时进度追踪**：可视化展示AI的完整思考过程
- **多种研究模式**：平衡、深度、快速、超快四种模式
- **响应式设计**：支持亮色/暗色主题的现代玻璃态设计
- **知识图谱可视化**：自动生成Mermaid.js关系图谱

### 🛠 技术栈

*   **前端框架**：[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **样式系统**：[Tailwind CSS](https://tailwindcss.com/) 玻璃态设计
*   **AI引擎**：[Google Gemini API](https://github.com/google/generative-ai-js) 多模型支持
*   **图表可视化**：[Mermaid.js](https://mermaid.js.org/) 知识图谱
*   **构建工具**：Vite + ESBuild 快速构建

## 🌟 特性展示

### 双智能体协作演示

```
🤖 Alpha智能体: "我建议从理论框架开始，先分析人工智能的发展历程..."
🤖 Beta智能体: "同意，但我们还需要关注具体的技术实现细节和应用案例..."
🤖 Alpha智能体: "很好的补充，让我们将研究分为四个主要部分..."
```

### 学术大纲自动生成

```markdown
# 人工智能发展现状与趋势综述

## 1. 摘要 (300-500字)
- 研究背景与意义
- 主要发现与结论

## 2. 引言 (1000-1500字)
- 2.1 研究背景
- 2.2 研究目标与意义
- 2.3 论文结构

## 3. 文献综述 (2000-3000字)
- 3.1 人工智能发展历程
- 3.2 关键技术突破
- 3.3 研究现状分析

## 4. 深度分析 (3000-4000字)
- 4.1 技术发展趋势
- 4.2 应用领域拓展
- 4.3 挑战与机遇

## 5. 结论 (800-1200字)
- 5.1 主要发现总结
- 5.2 未来发展方向
- 5.3 研究局限性

## 6. 参考文献
```

## 快速开始

本节将指导您在本地环境中设置和运行KResearch应用程序。

### 环境要求

使用本应用程序需要准备以下环境：
*   **Google Gemini API密钥**：从 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取
*   **Node.js**：建议使用最新的LTS版本（18.x或更高）
*   **包管理器**：npm、yarn或pnpm

### 安装步骤

1.  **克隆仓库**
    ```bash
    git clone https://github.com/KuekHaoYang/KResearch.git
    cd KResearch
    ```

2.  **安装依赖**
    ```bash
    npm install
    # 或者使用 yarn
    yarn install
    # 或者使用 pnpm
    pnpm install
    ```

3.  **配置环境变量**
    按照 [配置说明](#配置说明) 部分设置您的API密钥

## 使用指南

### 基本使用

1.  **启动开发服务器**
    ```bash
    npm run dev
    ```
    然后在浏览器中访问终端显示的本地地址（例如：`http://localhost:5173`）

2.  **配置API密钥**
    如果您没有设置`.env`文件，请在**设置**模态框中输入您的Google Gemini API密钥

3.  **选择研究模式**
    - **平衡模式**：兼顾速度和深度的标准研究
    - **深度模式**：最全面的学术级研究（推荐用于学术论文）
    - **快速模式**：快速获取核心信息
    - **超快模式**：最快速的概览性研究

4.  **输入研究主题**
    在主文本区域输入您的研究主题或问题

5.  **开始研究**
    点击"开始研究"按钮或按`Enter`键启动

6.  **监控进度**
    观察研究日志，了解AI智能体的工作过程，您可以随时停止研究

7.  **查看结果**
    研究完成后，将显示最终报告、知识图谱和引用来源

### 学术模式

KResearch的学术模式专为生成高质量学术综述论文而设计：

#### 🎓 学术大纲生成
- Alpha和Beta智能体协作设计符合学术标准的论文结构
- 自动生成包含摘要、引言、文献综述、分析讨论、结论的完整框架
- 确保逻辑严密、层次清晰的学术写作结构

#### 📖 深度内容研究
- 基于学术大纲进行针对性的深度搜索
- 优先获取学术文献、研究报告、权威机构资料
- 每个章节都有充足的学术资料支撑

#### 📝 学术论文生成
- 生成8000字以上的高质量学术综述论文
- 严格遵循学术写作规范和引用格式
- 包含完整的参考文献列表和规范引用

## Docker部署

使用预构建的Docker镜像是运行KResearch最快捷的方式。

### 🐳 快速部署

1.  **拉取并运行容器**
    在终端中执行以下命令下载并启动应用程序：

    ```bash
    docker run -p 8080:80 --name kresearch kuekhaoyang/kresearch:latest
    ```

    参数说明：
    - `-p 8080:80`：将本地端口8080映射到容器端口80
    - `--name kresearch`：为容器指定名称便于管理

2.  **访问应用程序**
    打开浏览器访问 `http://localhost:8080`

3.  **配置API密钥**
    应用程序加载后，点击**设置**图标输入您的Google Gemini API密钥
    密钥将保存在浏览器本地存储中，无需重复输入

### 🔧 Docker Compose部署

如果您需要更复杂的部署配置，可以使用Docker Compose：

```yaml
version: '3.8'
services:
  kresearch:
    image: kuekhaoyang/kresearch:latest
    ports:
      - "8080:80"
    environment:
      - API_KEY=your_gemini_api_key_here
    restart: unless-stopped
```

## 配置说明

应用程序需要Google Gemini API密钥才能正常运行。您有两种配置方式：

### 方式一：应用内设置（Docker部署推荐）

直接在应用程序的**设置**模态框中输入API密钥。密钥将安全地存储在浏览器的本地存储中，每个浏览器只需输入一次。这是使用Docker部署时的推荐方法。

### 方式二：环境变量文件（本地开发推荐）

对于本地开发（`npm run dev`）或docker-compose部署，您可以在项目根目录创建`.env`文件。应用程序将自动从此文件加载密钥。

1.  **创建环境文件**
    在项目根目录创建名为`.env`的文件

2.  **添加API密钥**
    ```bash
    # .env
    API_KEY="YOUR_GEMINI_API_KEY"
    ```

### 🔑 获取API密钥

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 登录您的Google账户
3. 创建新的API密钥
4. 复制密钥并按上述方式配置

> **注意**：请妥善保管您的API密钥，不要将其提交到版本控制系统中

## 贡献指南

开源社区的贡献让我们能够学习、启发和创造。我们**非常感谢**您的任何贡献！

### 🤝 如何贡献

1. **Fork项目**
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **开启Pull Request**

### 📋 贡献类型

- 🐛 **Bug修复**：发现并修复问题
- ✨ **新功能**：添加新的功能特性
- 📚 **文档改进**：完善文档和示例
- 🎨 **UI/UX优化**：改进用户界面和体验
- ⚡ **性能优化**：提升应用性能

如果您有建议或想法，请先开启一个Issue进行讨论。

## 许可证

本项目基于MIT许可证分发。详细信息请查看 `LICENSE` 文件。

## 联系方式

**项目维护者**：Kuek Hao Yang - [@KuekHaoYang](https://github.com/KuekHaoYang)

**项目链接**：[https://github.com/KuekHaoYang/KResearch](https://github.com/KuekHaoYang/KResearch)

如有问题、疑问或功能请求，请使用 [GitHub Issues](https://github.com/KuekHaoYang/KResearch/issues) 页面。

## 致谢

- 🚀 **Google Gemini API** 提供强大的AI能力支持
- 🎨 **现代玻璃态设计** 灵感来源于当代UI设计趋势
- 🤖 **双智能体架构** 创新的AI协作研究模式
- 🌟 **开源社区** 感谢所有贡献者的支持和反馈

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个Star！⭐**

[🚀 立即开始使用](https://github.com/KuekHaoYang/KResearch) | [📖 查看文档](https://github.com/KuekHaoYang/KResearch/wiki) | [🐛 报告问题](https://github.com/KuekHaoYang/KResearch/issues)

</div>