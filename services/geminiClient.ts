
import { apiKeyService, AllKeysFailedError } from "./apiKeyService";
import { settingsService } from "./settingsService";
import { apiIntervalManager } from "./apiIntervalManager";

// Helper to get a clean error message from various error types
const getCleanErrorMessage = (error: any): string => {
    if (!error) return 'An unknown error occurred.';
    if (typeof error === 'string') return error;

    if (error.message && typeof error.message === 'string') {
        try {
            const parsed = JSON.parse(error.message);
            return parsed?.error?.message || error.message;
        } catch (e) {
            return error.message;
        }
    }
    if (error.str && typeof error.str === 'string') return error.str;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null) {
        try { return JSON.stringify(error, null, 2); }
        catch { return 'Received an un-stringifiable error object.'; }
    }
    return String(error);
};

// Helper to sanitize potentially large objects for logging
const sanitizeForLogging = (obj: any, truncateLength: number = 500) => {
    if (!obj) return obj;
    try {
        return JSON.parse(JSON.stringify(obj, (key, value) => {
            if (typeof value === 'string' && value.length > truncateLength) {
                return value.substring(0, truncateLength) + '...[TRUNCATED]';
            }
            return value;
        }));
    } catch (e) {
        return { error: "Failed to sanitize for logging" };
    }
};

// Formats the flexible `contents` parameter from the SDK style to the strict REST API style
function formatContentsForRest(contents: any): any[] {
    if (typeof contents === 'string') {
        return [{ role: 'user', parts: [{ text: contents }] }];
    }
    if (Array.isArray(contents)) {
        return contents; // Assumes it's already a Content[] array
    }
    if (typeof contents === 'object' && contents !== null && contents.parts) {
        // A single Content object, wrap it in an array and default the role
        return [{ role: contents.role || 'user', parts: contents.parts }];
    }
    console.warn("Unknown contents format, passing through:", contents);
    return [contents];
}

// Maps the SDK-style `params` object to a REST API-compatible request body
function mapToRestBody(params: any): object {
    const body: any = {};
    if (params.contents) {
        body.contents = formatContentsForRest(params.contents);
    }
    if (params.config) {
        const { systemInstruction, tools, ...generationConfig } = params.config;
        if (Object.keys(generationConfig).length > 0) {
            body.generationConfig = generationConfig;
        }
        if (systemInstruction) {
            body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }
        if (tools) body.tools = tools;
    }
    return body;
}

const operationToRestMethod: Record<string, string> = {
    'generateContent': 'generateContent',
};

// The core executor with retry logic, now using `fetch` instead of the SDK
async function executeWithRetry(operationName: string, params: any, userSignal?: AbortSignal): Promise<any> {
    const keys = apiKeyService.getApiKeys();
    if (keys.length === 0) {
        throw new Error("No API keys provided. Please add at least one key in the application settings.");
    }

    const maxRetriesPerKeyCycle = 2; // Reduced from 3 to shorten wait time on persistent errors
    const maxAttempts = keys.length * maxRetriesPerKeyCycle;
    let lastError: any = null;
    const baseUrl = apiKeyService.getApiBaseUrl();
    const modelName = params.model;
    const restMethod = operationToRestMethod[operationName];

    if (!modelName || !restMethod) {
        throw new Error(`Invalid model or operation for API call: ${modelName}, ${operationName}`);
    }

    const url = `${baseUrl}/v1beta/models/${modelName}:${restMethod}`;

    const { researchParams } = settingsService.getSettings();
    const requestTimeoutMs = researchParams.requestTimeoutMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const key = apiKeyService.getNextApiKey();
        if (!key) continue;

        console.log(`[API Request] URL: ${url}, Attempt: ${attempt}/${maxAttempts}, Key: ...${key.slice(-4)}`);
        console.log(`[API Request] Parameters:`, sanitizeForLogging(params, 4000));

        try {
            const body = mapToRestBody(params);
            const timeoutController = new AbortController();
            const timeoutId = setTimeout(() => timeoutController.abort(), requestTimeoutMs);

            const combinedSignal = (() => {
                if (!userSignal) return timeoutController.signal;
                
                const combinedController = new AbortController();
                const onAbort = () => {
                    combinedController.abort();
                    userSignal.removeEventListener('abort', onAbort);
                    timeoutController.signal.removeEventListener('abort', onAbort);
                };
                userSignal.addEventListener('abort', onAbort);
                timeoutController.signal.addEventListener('abort', onAbort);
                return combinedController.signal;
            })();

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
                    body: JSON.stringify(body),
                    signal: combinedSignal
                });

            const responseText = await response.text();
            let result;

            if (!response.ok) {
                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch {
                    const err = new Error(`API Error: ${response.status} - ${responseText}`);
                    (err as any).status = response.status;
                    throw err;
                }
                const err = new Error(errorData?.error?.message || `API Error: ${response.status}`);
                (err as any).status = response.status;
                (err as any).data = errorData;
                throw err;
            }
            
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.warn(`[API Response] Failed to parse JSON, treating as incomplete response. Raw text: "${responseText}"`);
                throw new Error('Failed to parse JSON response');
            }

            const sdkLikeResponse = {
                ...result,
                text: result?.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
            };

            if (!sdkLikeResponse.text || sdkLikeResponse.text.trim() === '') {
                throw new Error('Empty response from API');
            }

            console.log(`[API Success] Operation: ${operationName}`);
            console.log(`[API Response]:`, sanitizeForLogging(sdkLikeResponse));
                // The flawed delayed reset is removed to ensure stable key rotation.
                return sdkLikeResponse;
            } finally {
                clearTimeout(timeoutId);
            }

        } catch (error: any) {
            if (error.name === 'AbortError') {
                // Check if the abort was triggered by the user or by our timeout
                if (userSignal?.aborted) {
                    console.log(`[API Call Aborted] Operation: '${operationName}' was aborted by the user.`);
                    throw error; // Re-throw the original abort error to stop the process
                } else {
                    console.warn(`[API Call Timeout] Operation: '${operationName}' timed out after ${requestTimeoutMs}ms.`);
                    // Let it fall through to the retry logic
                }
            }
            const errorMessage = getCleanErrorMessage(error);
            console.warn(`[API Call Failed: Attempt ${attempt}/${maxAttempts}] Operation: '${operationName}' with key ...${key.slice(-4)}. Error: ${errorMessage}`);
            lastError = error;
            
            // Apply exponential backoff with jitter for most errors (network, 5xx, 429, empty responses)
            // This handles generic "Failed to fetch" errors like ERR_CONNECTION_CLOSED and empty API responses
            const isServerError = error.status >= 500 && error.status < 600;
            const isRateLimit = error.status === 429;
            const isEmptyResponse = errorMessage === 'Empty response from API';
            const isJsonParseError = errorMessage === 'Failed to parse JSON response';

            if (isServerError || isRateLimit || errorMessage === 'Failed to fetch' || isEmptyResponse || isJsonParseError) {
                const errorType = isJsonParseError ? 'JSON parse error' : (isRateLimit ? 'Rate limit' : (isServerError ? 'Server error' : (isEmptyResponse ? 'Empty response' : 'Network error')));

                if (isRateLimit) {
                    apiIntervalManager.record429Error();
                }
                
                const retriesOnThisKey = (attempt - 1) % maxRetriesPerKeyCycle;
                const baseDelay = isServerError ? 5000 : 3000; // Longer base delay for server errors and network issues
                let delayMs = baseDelay * Math.pow(2, retriesOnThisKey); // Exponential backoff based on retries for the current key
                delayMs += Math.random() * 1000; // Add jitter of up to 1 second

                // For 429, respect 'Retry-After' header if present
                if (isRateLimit) {
                    const retryInfo = error.data?.error?.details?.find(
                        (d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
                    );
                    if (retryInfo?.retryDelay) {
                        const secondsMatch = retryInfo.retryDelay.match(/(\d+)/);
                        if (secondsMatch?.[1]) {
                            const delaySeconds = parseInt(secondsMatch[1], 10);
                            delayMs = delaySeconds * 1000 + 500; // Use server-suggested delay + buffer
                            console.log(`[API Retry] Rate limit hit. Respecting 'retryDelay' of ${delaySeconds}s. Waiting...`);
                        }
                    } else {
                        console.log(`[API Retry] Rate limit hit. Applying exponential backoff of ${delayMs.toFixed(0)}ms. Waiting...`);
                    }
                } else {
                    console.log(`[API Retry] ${errorType} (${error.status || 'N/A'}). Applying exponential backoff of ${delayMs.toFixed(0)}ms. Waiting...`);
                }
                
                await new Promise(resolve => setTimeout(resolve, delayMs));
                // Continue to the next attempt after the delay
            }
        }
    }

    const finalErrorMessage = getCleanErrorMessage(lastError);
    console.error(`[API Error: All Keys Failed] Operation: '${operationName}'. Last error: ${finalErrorMessage}`);
    console.error(`[API Error] Failed Parameters:`, sanitizeForLogging(params, 4000));
    throw new AllKeysFailedError(`All API keys failed. Last error: ${finalErrorMessage}`);
}

// A simplified `ai` object that uses our fetch-based retry logic
export const ai = {
    models: {
        generateContent: (params: any, signal?: AbortSignal): Promise<any> => {
            return executeWithRetry('generateContent', params, signal);
        },
        // Other methods like generateContentStream, generateImages, and chats are not used
        // by the app and are omitted to avoid implementing their fetch-based logic.
    },
};
