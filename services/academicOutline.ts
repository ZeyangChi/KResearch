import { ai } from './geminiClient';
import { getModel } from './models';
import { parseJsonFromMarkdown } from './utils';
import { ResearchMode, FileData, Role, AgentPersona, DebateUpdate } from '../types';
import { apiKeyService } from './apiKeyService';
import { settingsService } from './settingsService';
import { researchContext } from './researchContext';

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

interface AcademicOutlineTurn {
    thought: string;
    action: 'continue_debate' | 'finalize_outline';
    outline_section?: string | null;
    final_outline?: string | null;
}

const academicOutlineTurnSchema = {
    type: "object",
    properties: {
        thought: {
            type: "string",
            description: "Your reasoning about the academic outline structure"
        },
        action: {
            type: "string",
            enum: ["continue_debate", "finalize_outline"],
            description: "Whether to continue debating or finalize the outline"
        },
        outline_section: {
            type: "string",
            description: "A specific section or improvement to discuss (only if action is continue_debate)"
        },
        final_outline: {
            type: "string",
            description: "The complete academic outline in markdown format (only if action is finalize_outline)"
        }
    },
    required: ["thought", "action"]
};

const getAcademicOutlinePrompt = (
    nextPersona: AgentPersona,
    clarifiedQuery: string,
    fileData: FileData | null,
    role: Role | null,
    conversationText: string,
    isFirstTurn: boolean
): string => {
    const roleContext = getRoleContext(role);
    
    return `
You are Agent ${nextPersona}, operating under the KResearch Academic Outline Protocol. Your role is that of a ${nextPersona === 'Alpha' ? 'Chief Academic Strategist, focusing on overall structure and theoretical framework' : 'Academic Implementation Expert, focusing on detailed content planning and execution'}.

Your singular goal is to collaboratively design a comprehensive academic review paper outline that achieves the highest scholarly standards.

${roleContext}

**Research Topic:**
"${clarifiedQuery}"

**Provided File:** ${fileData ? `A file named '${fileData.name}' was provided and must be integrated into the academic structure.` : 'None'}
**Role-specific File:** ${role?.file?.name || 'None'}

**Academic Outline Requirements:**
1. **Standard Academic Structure**: Abstract, Introduction, Literature Review, Main Analysis Sections, Conclusion, References
2. **Comprehensive Depth**: Design for 8000-12000 words total
3. **Scholarly Rigor**: Each section must have clear research objectives and expected content
4. **Logical Flow**: Ensure seamless progression between sections
5. **Citation Framework**: Plan for extensive academic citations and references

**Your Specific Role:**
${nextPersona === 'Alpha' ? `
As Chief Academic Strategist:
- Design the overall theoretical framework and research approach
- Establish the main research questions and hypotheses
- Plan the high-level structure and section organization
- Ensure academic rigor and scholarly standards
` : `
As Academic Implementation Expert:
- Refine Alpha's framework with detailed content specifications
- Plan specific subsections and content requirements
- Ensure practical feasibility and comprehensive coverage
- Optimize for academic writing standards and citation requirements
`}

**Previous Conversation:**
${conversationText || 'This is the beginning of the academic outline collaboration.'}

**Instructions:**
${isFirstTurn ? `
As the ${nextPersona === 'Alpha' ? 'first' : 'second'} agent, ${nextPersona === 'Alpha' ? 'propose an initial academic structure' : 'review and enhance the proposed structure'}.
` : `
Continue the collaborative refinement of the academic outline. Build upon previous discussions.
`}

Your response must be a JSON object matching the provided schema. Focus on creating a scholarly, comprehensive outline that will guide the generation of a high-quality academic review paper.
`;
};

export const generateAcademicOutline = async (
    clarifiedQuery: string,
    mode: ResearchMode,
    fileData: FileData | null,
    role: Role | null,
    signal?: AbortSignal,
    onDebateUpdate?: (update: DebateUpdate) => void
): Promise<string> => {
    // 设置研究上下文
    researchContext.setMode(mode);

    const { researchParams } = settingsService.getSettings();
    const maxDebateRounds = researchParams.maxDebateRounds;
    let debateTurns = 0;
    let currentConversation: Array<{ persona: AgentPersona; thought: string }> = [];
    let nextPersona: AgentPersona = 'Alpha';

    while (debateTurns < maxDebateRounds) {
        const checkSignal = () => {
            if (signal?.aborted) {
                throw new Error('Academic outline generation was aborted');
            }
        };
        
        checkSignal();
        debateTurns++;
        
        const isFirstTurn = currentConversation.length === 0;
        const conversationText = currentConversation.map(t => `${t.persona}: ${t.thought}`).join('\n');

        const prompt = getAcademicOutlinePrompt(
            nextPersona,
            clarifiedQuery,
            fileData,
            role,
            conversationText,
            isFirstTurn
        );

        const parts: ({ text: string } | { inlineData: { mimeType: string; data: string; } })[] = [{ text: prompt }];
        
        // Handle file attachments
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

        // Handle role file attachments
        if (role?.file) {
            if (role.file.extractedText) {
                const roleFileContext = `\n\n--- Role File Content (${role.file.name}) ---\n${role.file.extractedText}`;
                const firstPart = parts[0];
                if ('text' in firstPart) {
                    firstPart.text += roleFileContext;
                }
            } else if (role.file.mimeType.startsWith('image/')) {
                parts.push({ inlineData: { mimeType: role.file.mimeType, data: role.file.data } });
            }
        }

        checkSignal();
        let parsedResponse: AcademicOutlineTurn | null = null;
        let turnSuccessful = false;
        const maxTurnRetries = 2;

        for (let turnAttempt = 1; turnAttempt <= maxTurnRetries; turnAttempt++) {
            checkSignal();

            const response = await ai.models.generateContent({
                model: getModel('academicOutline', mode),
                contents: { parts },
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.7,
                    responseSchema: academicOutlineTurnSchema
                }
            }, signal);
            
            checkSignal();

            if (!response.text || response.text.trim() === '') {
                console.warn(`[Academic Outline] Agent ${nextPersona} (Turn ${debateTurns}, Attempt ${turnAttempt}/${maxTurnRetries}) returned an empty response.`);
                console.warn(`[Academic Outline] Response details:`, {
                    hasText: !!response.text,
                    textLength: response.text?.length || 0,
                    hasPromptFeedback: !!response.promptFeedback,
                    blockReason: response.promptFeedback?.blockReason,
                    modelVersion: response.modelVersion
                });

                if (response.promptFeedback?.blockReason) {
                    console.error(`[Academic Outline] Request blocked by API. Reason: ${response.promptFeedback.blockReason}`);
                }

                if (turnAttempt < maxTurnRetries) {
                    // 渐进式重试间隔：3s -> 6s
                    const retryDelay = turnAttempt === 1 ? 3000 : 6000;
                    console.log(`[Academic Outline] Waiting ${retryDelay}ms before retry attempt ${turnAttempt + 1}...`);
                    await new Promise(res => setTimeout(res, retryDelay));
                }
                continue; // Next attempt
            }

            const tempParsed = parseJsonFromMarkdown(response.text) as AcademicOutlineTurn;

            if (!tempParsed || !tempParsed.thought) {
                console.warn(`[Academic Outline] Agent ${nextPersona} (Turn ${debateTurns}, Attempt ${turnAttempt}/${maxTurnRetries}) returned invalid JSON or empty thought.`);
                console.warn(`[Academic Outline] Parse details:`, {
                    hasParsedResult: !!tempParsed,
                    hasThought: !!(tempParsed?.thought),
                    thoughtLength: tempParsed?.thought?.length || 0,
                    action: tempParsed?.action,
                    rawTextLength: response.text?.length || 0,
                    rawTextPreview: response.text?.substring(0, 200) + (response.text?.length > 200 ? '...' : '')
                });

                if (turnAttempt < maxTurnRetries) {
                    // 渐进式重试间隔：3s -> 6s
                    const retryDelay = turnAttempt === 1 ? 3000 : 6000;
                    console.log(`[Academic Outline] JSON parse failed, waiting ${retryDelay}ms before retry attempt ${turnAttempt + 1}...`);
                    await new Promise(res => setTimeout(res, retryDelay));
                }
                continue; // Next attempt
            }

            parsedResponse = tempParsed;
            turnSuccessful = true;
            break; // Success, exit turn retry loop
        }

        if (!turnSuccessful || !parsedResponse) {
            console.error(`[Academic Outline] Agent ${nextPersona} failed to provide a valid response after ${maxTurnRetries} attempts.`);
            console.error(`[Academic Outline] Turn failure details:`, {
                currentTurn: debateTurns,
                maxTurns: maxDebateRounds,
                failedAgent: nextPersona,
                conversationLength: currentConversation.length,
                hasAnyConversation: currentConversation.length > 0
            });

            // 不要直接跳过，而是尝试让另一个Agent继续
            // 如果两个Agent都连续失败，才考虑跳过
            console.warn(`[Academic Outline] Attempting to continue with other agent instead of skipping turn...`);
            debateTurns++;
            nextPersona = nextPersona === 'Alpha' ? 'Beta' : 'Alpha'; // Switch persona for next round
            continue;
        }

        // Add to conversation history
        currentConversation.push({
            persona: nextPersona,
            thought: parsedResponse.thought
        });

        // 调用辩论更新回调
        if (onDebateUpdate) {
            onDebateUpdate({
                id: Date.now() + Math.random(),
                persona: nextPersona,
                thought: parsedResponse.thought,
                timestamp: Date.now()
            });
        }

        // Check if we should finalize the outline
        if (parsedResponse.action === 'finalize_outline' && parsedResponse.final_outline) {
            return parsedResponse.final_outline;
        }

        // Switch to the other agent
        nextPersona = nextPersona === 'Alpha' ? 'Beta' : 'Alpha';
    }

    // If we've reached max rounds without finalization, create a final outline
    const finalPrompt = `
Based on the collaborative discussion between Alpha and Beta agents, create a comprehensive academic outline for the research topic: "${clarifiedQuery}"

Previous Discussion:
${currentConversation.map(t => `${t.persona}: ${t.thought}`).join('\n')}

Generate a complete academic review paper outline with the following structure:
1. Abstract (300-500 words)
2. Introduction (1000-1500 words)
3. Literature Review (2000-3000 words)
4. Main Analysis Sections (3000-4000 words total)
5. Conclusion (800-1200 words)
6. References

Each section should include detailed subsections and content specifications. Format as markdown with clear headings and bullet points for content requirements.
`;

    const finalResponse = await ai.models.generateContent({
        model: getModel('academicOutline', mode),
        contents: finalPrompt,
        config: { temperature: 0.6 }
    }, signal);

    if (!finalResponse || !finalResponse.text) {
        console.error(`[Academic Outline] Final generation failed. Response was empty.`, finalResponse);
        if (finalResponse.promptFeedback?.blockReason) {
            throw new Error(`Failed to generate final academic outline: Request was blocked by the API. Reason: ${finalResponse.promptFeedback.blockReason}`);
        }
        throw new Error("Failed to generate academic outline due to an empty response from the API.");
    }

    return finalResponse.text.trim();
};
