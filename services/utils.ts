export const parseJsonFromMarkdown = (text: string): any => {
    if (!text || text.trim() === '') {
        console.warn("parseJsonFromMarkdown received empty or null text.");
        return null;
    }

    // Find the start of the JSON block (either ```json or the first {)
    let jsonStr = text;
    const codeBlockMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
        jsonStr = codeBlockMatch[2];
    }

    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        console.error("Failed to find a valid JSON object within the text.", "Original text:", text);
        return null;
    }
    
    // Extract the content between the first and last brace
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);

    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse JSON response, even after aggressive extraction.", e, "Original text:", text, "Attempted JSON string:", jsonStr);
        return null; // Return null if all attempts fail
    }
};