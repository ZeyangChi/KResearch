
import { ai } from './geminiClient';
import { getModel } from './models';
import { ResearchUpdate, Citation, FinalResearchData, ResearchMode, FileData, ReportVersion, Role } from '../types';

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
    const learnings = history.filter(h => h.type === 'read').map(h => h.content).join('\n\n---\n\n');
    const historyText = history.map(h => `${h.persona ? h.persona + ' ' : ''}${h.type}: ${Array.isArray(h.content) ? h.content.join(' | ') : h.content}`).join('\n');
    const roleContext = getRoleContext(role);

    const corePrompt = academicOutline ? `You are a world-class academic researcher and scholarly writer. Your mission is to write a comprehensive, rigorous academic review paper that meets the highest scholarly standards.
${roleContext}
**Your Task:**
Write a complete academic review paper following strict scholarly conventions.

**Core Research Topic:**
<REQUIREMENT>${query}</REQUIREMENT>

**Academic Outline to Follow:**
<ACADEMIC_OUTLINE>
${academicOutline}
</ACADEMIC_OUTLINE>

**Evidence Base (Your Sole Source of Truth for content):**
*   **Attached File:** ${fileData ? `A file named '${fileData.name}' was provided and its content is a primary source.` : "No file was provided."}
*   **Role-specific File:** ${role?.file ? `A file named '${role.file.name}' was provided with the role and its content is a primary source.` : "No file was provided with the role."}
*   **Synthesized Research Learnings:** <LEARNINGS>${learnings || "No specific content was read during research."}</LEARNINGS>
*   **Full Research History (For Context and Nuance):** <HISTORY>${historyText}</HISTORY>

**--- MANDATORY ACADEMIC WRITING STANDARDS ---**` : `You are an elite Senior Research Analyst. Your mission is to write a comprehensive, insightful, and substantial research report based on a collection of research materials.
${roleContext}
**Your Task:**
Write a polished and extensive final report.

**Core User Requirement:**
<REQUIREMENT>${query}</REQUIREMENT>

**Evidence Base (Your Sole Source of Truth for content):**
*   **Attached File:** ${fileData ? `A file named '${fileData.name}' was provided and its content is a primary source.` : "No file was provided."}
*   **Role-specific File:** ${role?.file ? `A file named '${role.file.name}' was provided with the role and its content is a primary source.` : "No file was provided with the role."}
*   **Synthesized Research Learnings:** <LEARNINGS>${learnings || "No specific content was read during research."}</LEARNINGS>
*   **Full Research History (For Context and Nuance):** <HISTORY>${historyText}</HISTORY>

**--- CRITICAL REPORTING INSTRUCTIONS ---**`;

    const instructions = academicOutline
    ? `
**1. MANDATORY Academic Structure Adherence:**
*   You **MUST** strictly follow the academic outline provided in \`<ACADEMIC_OUTLINE>\`. This is non-negotiable.
*   Every section and subsection specified in the outline must be present and fully developed.
*   Your output must conform to academic writing standards and scholarly conventions.
*   The very first line of your response **MUST BE** the H1 title as specified in the academic outline.

**2. Academic Writing Requirements:**
*   **Minimum Length**: 8000 words total. Each major section should be substantial:
    - Abstract: 300-500 words
    - Introduction: 1000-1500 words
    - Literature Review: 2000-3000 words
    - Main Analysis: 3000-4000 words
    - Conclusion: 800-1200 words
*   **Academic Language**: Use formal, scholarly language with precise terminology
*   **Critical Analysis**: Provide deep analytical insights, not just descriptive content
*   **Theoretical Framework**: Establish and maintain a clear theoretical foundation
*   **Evidence-Based Arguments**: Every claim must be supported by evidence from the research learnings

**3. Citation and Reference Standards:**
*   Use proper academic citation format (APA style preferred)
*   Include in-text citations for all factual claims and theoretical points
*   Create a comprehensive References section at the end
*   Ensure all sources from the research learnings are properly attributed
`
    : reportOutline
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

const commonInstructions = academicOutline ? `
**4. Academic Content Development:**
*   **Comprehensive Analysis**: Each section must provide thorough, scholarly analysis that goes beyond surface-level description
*   **Theoretical Integration**: Connect findings to established theoretical frameworks and academic literature
*   **Critical Evaluation**: Demonstrate critical thinking by evaluating evidence, identifying limitations, and discussing implications
*   **Scholarly Synthesis**: Synthesize information from multiple sources to create new insights and understanding
*   **Academic Rigor**: Maintain the highest standards of academic integrity and scholarly precision

**5. Section-Specific Requirements:**
*   **Abstract**: Concise summary including background, methods, key findings, and conclusions
*   **Introduction**: Clear research context, objectives, significance, and paper structure
*   **Literature Review**: Systematic analysis of existing research, identifying gaps and positioning your analysis
*   **Main Analysis**: In-depth examination with multiple perspectives, supported by evidence
*   **Conclusion**: Synthesis of findings, implications, limitations, and future research directions
` : `
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
*   **Tone & Formatting:** ${academicOutline ? 'Maintain formal academic writing style with scholarly language, precise terminology, and objective analysis. Use proper academic formatting with clear headings, numbered sections, and professional presentation.' : 'Maintain a formal, objective, and authoritative tone, unless your Role Directive specifies otherwise. Use Markdown extensively for clarity (headings, lists, bold text).'}
*   **Exclusivity:** The report's content must be based **exclusively** on the information provided. Do NOT invent information or use any outside knowledge. ${academicOutline ? 'Include proper academic citations for all claims and evidence.' : 'Do NOT include inline citations.'}

**Final Output:**
${academicOutline ? 'Respond ONLY with the complete academic review paper in raw markdown format, starting with the H1 title. The paper must be comprehensive, scholarly, and meet the 8000+ word requirement. Include a complete References section at the end.' : 'Respond ONLY with the raw markdown content of the final report, starting with the H1 title. Do not add any conversational text or explanation.'}
`;

    const finalReportPrompt = `${corePrompt}\n${instructions}\n${commonInstructions}`;

    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string; } })[] = [{ text: finalReportPrompt }];
    
    // Handle the main research file attachment
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
    
    const initialReport: ReportVersion = { content: reportText.trim(), version: 1 };
    return { reports: [initialReport], activeReportIndex: 0 };
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

    return response.text.trim();
};
