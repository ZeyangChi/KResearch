
import { ai } from './geminiClient';
import { getModel } from './models';
import { ResearchUpdate, Citation, FinalResearchData, ResearchMode, FileData, ReportVersion, Role } from '../types';
import { researchContext } from './researchContext';
import { citationManager, citationTextProcessor } from './citationManager';

const getRoleContext = (role: Role | null): string => {
    if (!role) return '';
    return `
**Primary Role Directive:**
You must adopt the following persona and instructions for this entire task. This directive supersedes all other instructions if there is a conflict.
<ROLE_INSTRUCTIONS>
${role.prompt}
</ROLE_INSTRUCTIONS>
`;
};

/**
 * 生成引文使用指南
 */
const getCitationInstructions = (): string => {
    const stats = citationManager.getStats();
    const availableCitations = citationManager.getAllCitations();

    if (availableCitations.length === 0) {
        return `
**Citation Instructions:**
No citations are available for this report. Focus on synthesizing the provided research learnings without citation markers.
`;
    }

    const citationList = availableCitations
        .map(citation => `[${citation.id}] ${citation.title} (${citation.url})`)
        .join('\n');

    return `
**Citation Instructions:**
You have access to ${stats.total} citations. When referencing information that comes from these sources, use the appropriate digital citation markers:

**Available Citations:**
${citationList}

**Citation Usage Rules:**
- Use [1], [2], [3] format for individual citations
- Use [1, 2] for multiple non-consecutive citations
- Use [1-3] for consecutive citations
- Place citations immediately after the relevant statement, before punctuation
- Only use citation numbers that correspond to the available citations listed above
`;
};

const generateChapter = async (
    chapterOutline: string,
    query: string,
    fullOutline: string,
    learnings: string,
    mode: ResearchMode,
    signal?: AbortSignal
): Promise<string> => {
    const citationInstructions = getCitationInstructions();

    const prompt = `
You are a world-class academic writer. Your task is to write a single, specific chapter for a larger academic review paper based on the provided chapter outline and the full body of research learnings.

**Overall Research Topic:** ${query}

${citationInstructions}

**Full Academic Outline (for context):**
<FULL_OUTLINE>
${fullOutline}
</FULL_OUTLINE>

**Chapter to Write (Your SOLE focus):**
<CHAPTER_OUTLINE>
${chapterOutline}
</CHAPTER_OUTLINE>

**Evidence Base (Your source of truth):**
<LEARNINGS>
${learnings}
</LEARNINGS>

**Instructions:**
1.  **Focus EXCLUSIVELY** on writing the content for the chapter specified in \`<CHAPTER_OUTLINE>\`.
2.  Do NOT write any other chapters. Do NOT write the main title, abstract, or references section unless this chapter is specifically the "Abstract" or "References" section.
3.  Adhere strictly to the content points and structure detailed in the \`<CHAPTER_OUTLINE>\`.
4.  Write in a formal, scholarly tone, using precise academic language.
5.  Synthesize information from the \`<LEARNINGS>\` to build your arguments and provide evidence.
6.  Ensure the chapter is comprehensive, well-structured, and meets the implicit word count and depth requirements of its outline.
7.  **CRITICAL**: When referencing information from the learnings, you MUST include digital citation markers in the format [1], [2], [3], etc. These will be automatically linked to the reference list.
8.  Use multiple citations where appropriate, e.g., [1, 2] or [1-3] for consecutive citations.
9.  Place citation markers immediately after the relevant statement, before punctuation marks.

**Output:**
Respond ONLY with the raw Markdown content for the chapter you are tasked to write. Start directly with the chapter heading (e.g., \`## 2. Literature Review\`).
`;
    const response = await ai.models.generateContent({
        model: getModel('synthesizer', mode),
        contents: prompt,
        config: { temperature: 0.5 }
    }, signal);

    if (!response || !response.text) {
        console.warn(`Warning: Generation for chapter "${chapterOutline.split('\n')[0]}" returned empty content.`);
        return `## ${chapterOutline.split('\n')[0]}\n\n[Content generation for this chapter failed or returned empty.]\n\n`;
    }

    // 处理生成的章节内容，验证和优化引文标记
    let chapterContent = response.text.trim();

    // 验证引文标记的有效性
    const validation = citationTextProcessor.validateCitationMarks(chapterContent);
    if (!validation.isValid) {
        console.warn(`[Synthesis] Chapter contains invalid citation marks:`, validation.errors);
        // 可以选择修复或记录错误，这里我们记录但继续
    }

    console.log(`[Synthesis] Chapter generated with citation marks validated`);
    return chapterContent;
};


export const synthesizeReport = async (
    query: string,
    history: ResearchUpdate[],
    citations: Citation[],
    mode: ResearchMode,
    fileData: FileData | null,
    role: Role | null,
    reportOutline: string,
    signal?: AbortSignal,
    academicOutline?: string | null
): Promise<Omit<FinalResearchData, 'researchTimeMs' | 'searchCycles' | 'researchUpdates' | 'citations'>> => {
    // 设置研究上下文
    researchContext.setMode(mode);

    // 初始化引文管理器
    citationManager.clear(); // 清除之前的引文
    citationManager.addCitations(citations); // 添加当前引文
    console.log(`[Synthesis] Initialized citation manager with ${citations.length} citations`);

    if (academicOutline) {
        // --- Academic Report Generation (Chapter by Chapter) ---
        const learnings = history.filter(h => h.type === 'read').map(h => h.content).join('\n\n---\n\n');
        
        // 1. Split outline into chapters
        const chapters = academicOutline.split(/\n(?=#{1,2}\s)/).map(c => c.trim()).filter(c => c);
        
        const generatedChapters: string[] = [];

        // 2. Generate each chapter sequentially
        for (const chapter of chapters) {
             if (signal?.aborted) throw new DOMException('Report synthesis aborted by user.', 'AbortError');
            
            // A simple notification update could be sent here to the UI if onUpdate callback is available
            console.log(`Generating chapter: ${chapter.split('\n')[0]}...`);
            
            const chapterContent = await generateChapter(chapter, query, academicOutline, learnings, mode, signal);
            generatedChapters.push(chapterContent);
            
            // Add a delay between chapter generations to avoid hitting API rate limits
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // 3. Combine chapters into a single report
        const finalReportContent = generatedChapters.join('\n\n');
        const initialReport: ReportVersion = { content: finalReportContent, version: 1 };
        return { reports: [initialReport], activeReportIndex: 0 };

    } else {
        // --- Original Report Generation Logic ---
        const learnings = history.filter(h => h.type === 'read').map(h => h.content).join('\n\n---\n\n');
        const historyText = history.map(h => `${h.persona ? h.persona + ' ' : ''}${h.type}: ${Array.isArray(h.content) ? h.content.join(' | ') : h.content}`).join('\n');
        const roleContext = getRoleContext(role);
    
        const citationInstructions = getCitationInstructions();

        const corePrompt = `You are an elite Senior Research Analyst. Your mission is to write a comprehensive, insightful, and substantial research report based on a collection of research materials.
${roleContext}
**Your Task:**
Write a polished and extensive final report.

${citationInstructions}

**Core User Requirement:**
<REQUIREMENT>${query}</REQUIREMENT>

**Evidence Base (Your Sole Source of Truth for content):**
*   **Attached File:** ${fileData ? `A file named '${fileData.name}' was provided and its content is a primary source.` : "No file was provided."}
*   **Role-specific File:** ${role?.file ? `A file named '${role.file.name}' was provided with the role and its content is a primary source.` : "No file was provided with the role."}
*   **Synthesized Research Learnings:** <LEARNINGS>${learnings || "No specific content was read during research."}</LEARNINGS>
*   **Full Research History (For Context and Nuance):** <HISTORY>${historyText}</HISTORY>

**--- CRITICAL REPORTING INSTRUCTIONS ---**`;
    
        const instructions = reportOutline
        ? `
**1. Adherence to Outline & Role:**
*   You **MUST** follow the structure provided in the \`<OUTLINE>\` below. This includes all specified headings, subheadings, and content points.
*   Your output and tone must be consistent with your assigned Role Directive.
*   The very first line of your response **MUST BE** the H1 title as specified in the outline.

**Mandatory Report Outline (Your primary guide for structure and content):**
<OUTLINE>
${reportOutline}
</OUTLINE>
`
        : `
**1. Structure and Content Generation:**
*   You must create a logical and comprehensive structure for the report yourself. A good report generally includes an Executive Summary, a Detailed Analysis with multiple sub-sections for key themes identified from the research, and a Conclusion.
*   Your output and tone must be consistent with your assigned Role Directive.
*   The very first line of your response **MUST BE** an H1 markdown title for the report (e.g., \`# An In-Depth Analysis of X\`).`;
    
    const commonInstructions = `
**2. Content Generation:**
*   Flesh out each section with detailed analysis, synthesizing information from the \`<LEARNINGS>\` block, the attached files, and the broader research history.
*   Provide in-depth analysis. Do not just list facts; interpret them, connect disparate points, and discuss the implications, all through the lens of your role.

**3. Stylistic and Formatting Requirements:**
*   **Evidence-Based Assertions:** This is non-negotiable. Every key assertion, claim, or data point MUST be grounded in the provided research data.
*   **Data Visualization with Mermaid.js:** Mermaid.js syntax is extremely strict. Syntactic perfection is mandatory to prevent rendering errors. If you determine a diagram is necessary to explain a complex relationship or process, you MUST create it following these rules:
    *   **Rule 1: ALWAYS Quote Text.** All user-facing text (in nodes, on edges, for labels, etc.) MUST be enclosed in double quotes. This is the most common source of errors because it correctly handles special characters.
        *   **Correct:** \`A["Node with (parentheses)"] -- "arrow text" --> B\`
        *   **Incorrect:** \`A[Node with (parentheses)] -- arrow text --> B\`
    *   **Rule 2: Use Safe Node IDs.** Node IDs MUST be a single word containing only letters and numbers (e.g., \`node1\`, \`stepA\`, \`db\`). Do NOT use quotes, spaces, hyphens, or other special characters in the IDs themselves.
    *   **Rule 3: Follow Strict Syntax Examples.** Do not deviate from these proven patterns.
        *   **Flowchart:**
            \`\`\`mermaid
            graph TD;
                nodeA["Text for Node A"] --> nodeB{"Decision Point?"};
                nodeB -- "Yes" --> nodeC["Outcome 1"];
                nodeB -- "No" --> nodeD["Outcome 2"];
            \`\`\`
        *   **Sequence Diagram:**
            \`\`\`mermaid
            sequenceDiagram;
                participant Alice;
                participant Bob;
                Alice->>Bob: "Hello Bob, how are you?";
                Bob-->>Alice: "I am great, thanks!";
            \`\`\`
        *   **State Diagram:**
             \`\`\`mermaid
            stateDiagram-v2;
                [*] --> State1;
                State1 --> State2: "Event T1";
                State2 --> [*];
            \`\`\`
    *   **Rule 4: Simplicity is Key.** Do not attempt complex styling or experimental features within the Mermaid code block. A simple, correct diagram is infinitely better than a complex, broken one.
    *   **Rule 5: Embed Correctly.** Embed the complete and valid \`\`\`mermaid ... \`\`\` code block directly in the relevant sections of the report.
*   **Digital Citations:** When referencing information from the research learnings or attached files, you MUST include digital citation markers in the format [1], [2], [3], etc. These will be automatically linked to the reference list. Use multiple citations where appropriate, e.g., [1, 2] or [1-3] for consecutive citations. Place citation markers immediately after the relevant statement, before punctuation marks.
*   **Tone & Formatting:** Maintain a formal, objective, and authoritative tone, unless your Role Directive specifies otherwise. Use Markdown extensively for clarity (headings, lists, bold text).
*   **Exclusivity:** The report's content must be based **exclusively** on the information provided. Do NOT invent information or use any outside knowledge.

**Final Output:**
Respond ONLY with the raw markdown content of the final report, starting with the H1 title. Do not add any conversational text or explanation.
`;
    
        const finalReportPrompt = `${corePrompt}\n${instructions}\n${commonInstructions}`;
    
        const parts: ({ text: string } | { inlineData: { mimeType: string; data:string; } })[] = [{ text: finalReportPrompt }];
        
        if (fileData) {
            if (fileData.extractedText) {
                const fileContext = `\n\n--- Attached File Content (${fileData.name}) ---\n${fileData.extractedText}`;
                const firstPart = parts[0];
                if ('text' in firstPart) {
                    firstPart.text += fileContext;
                }
            } else if (fileData.mimeType.startsWith('image/')) {
                parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
            }
        }
    
        if (role?.file) {
            if (role.file.extractedText) {
                const roleFileContext = `\n\n--- Attached Role File Content (${role.file.name}) ---\n${role.file.extractedText}`;
                const firstPart = parts[0];
                if ('text' in firstPart) {
                    firstPart.text += roleFileContext;
                }
            } else if (role.file.mimeType.startsWith('image/')) {
                parts.push({ inlineData: { mimeType: role.file.mimeType, data: role.file.data } });
            }
        }
    
        const reportResponse = await ai.models.generateContent({
            model: getModel('synthesizer', mode),
            contents: { parts },
            config: { temperature: 0.5 }
        }, signal);
        
        if (!reportResponse) {
            throw new Error("The API did not return a response during report synthesis. This might be due to content filters blocking the request.");
        }
    
        const reportText = reportResponse.text;

        if (!reportText) {
             return { reports: [{ content: "Failed to generate an initial report. The response from the AI was empty.", version: 1 }], activeReportIndex: 0 };
        }

        // 处理常规报告的引文标记
        let processedReportText = reportText.trim();

        // 验证引文标记的有效性
        const validation = citationTextProcessor.validateCitationMarks(processedReportText);
        if (!validation.isValid) {
            console.warn(`[Synthesis] Regular report contains invalid citation marks:`, validation.errors);
        }

        console.log(`[Synthesis] Regular report generated with citation marks validated`);

        const initialReport: ReportVersion = { content: processedReportText, version: 1 };
        return { reports: [initialReport], activeReportIndex: 0 };
    }
};

export const rewriteReport = async (
    originalReport: string,
    instruction: string,
    mode: ResearchMode,
    file: FileData | null,
    role: Role | null,
    signal?: AbortSignal
): Promise<string> => {
    const roleContext = getRoleContext(role);
    const prompt = `You are an expert copy editor. Your task is to rewrite the provided Markdown report based on a specific instruction.
${roleContext}
You must adhere to these rules:
1.  The output MUST be only the raw Markdown of the rewritten report. Do not add any conversational text, introductions, or explanations.
2.  Preserve the original meaning and data of the report unless the instruction explicitly asks to change it.
3.  Maintain the original Markdown formatting (headings, lists, etc.) as much as possible, including the initial H1 title.
4.  **CRITICAL**: Preserve all digital citation markers in the format [1], [2], [3], etc. These are essential for academic integrity and must not be removed or modified unless explicitly instructed.

**Original Report:**
<REPORT>
${originalReport}
</REPORT>

**Instruction:**
<INSTRUCTION>
${instruction}
</INSTRUCTION>

**Attached File (if any, provides additional context for the instruction):**
<FILE_CONTEXT>
${file ? `A file named '${file.name}' was attached.` : "No file was attached."}
${role?.file ? `A file named '${role.file.name}' was attached with the role.` : "No file was attached with the role."}
</FILE_CONTEXT>

Respond with the rewritten report now.`;

    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string; } })[] = [{ text: prompt }];
    
    // Handle the main research file attachment
    if (file) {
        if (file.extractedText) {
            const fileContext = `\n\n--- Attached File Content (${file.name}) ---\n${file.extractedText}`;
            const firstPart = parts[0];
            if ('text' in firstPart) {
                firstPart.text += fileContext;
            }
        } else if (file.mimeType.startsWith('image/')) {
            parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
        }
    }

    // Handle the file attached to a Role
    if (role?.file) {
        if (role.file.extractedText) {
            const roleFileContext = `\n\n--- Attached Role File Content (${role.file.name}) ---\n${role.file.extractedText}`;
            const firstPart = parts[0];
            if ('text' in firstPart) {
                firstPart.text += roleFileContext;
            }
        } else if (role.file.mimeType.startsWith('image/')) {
            parts.push({ inlineData: { mimeType: role.file.mimeType, data: role.file.data } });
        }
    }

    const response = await ai.models.generateContent({
        model: getModel('synthesizer', mode),
        contents: { parts },
        config: { temperature: 0.7 }
    }, signal);

    if (!response || !response.text) {
        throw new Error("The API did not return a response during report rewrite. This might be due to content filters blocking the request.");
    }

    // 处理重写后的报告，验证引文标记
    let rewrittenText = response.text.trim();

    // 验证引文标记的有效性
    const validation = citationTextProcessor.validateCitationMarks(rewrittenText);
    if (!validation.isValid) {
        console.warn(`[Synthesis] Rewritten report contains invalid citation marks:`, validation.errors);
    }

    console.log(`[Synthesis] Report rewritten with citation marks validated`);
    return rewrittenText;
};
