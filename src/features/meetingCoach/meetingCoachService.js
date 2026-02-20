/**
 * Meeting Coach Service
 * Orchestrates: STT → Question Detection → LLM → Response Formatting
 */

const QuestionDetector = require('./questionDetector');
const { createLLM } = require('../common/ai/factory');
const modelStateService = require('../common/services/modelStateService');
const internalBridge = require('../../bridge/internalBridge');
const settingsService = require('../settings/settingsService');

class MeetingCoachService {
    constructor() {
        this.questionDetector = new QuestionDetector();
        this.isActive = false;
        this.transcriptBuffer = [];
        this.maxBufferSize = 50; // Keep last 50 transcript segments (~2-5 minutes)
        this.currentSessionId = null;
        
        // Callbacks
        this.onAnswerGenerated = null;
        this.onStatusUpdate = null;
    }

    /**
     * Set callbacks for answer generation and status updates
     */
    setCallbacks({ onAnswerGenerated, onStatusUpdate }) {
        this.onAnswerGenerated = onAnswerGenerated;
        this.onStatusUpdate = onStatusUpdate;
    }

    /**
     * Start the meeting coach service
     */
    async start(sessionId) {
        if (this.isActive) {
            console.log('[MeetingCoach] Already active');
            return;
        }

        this.isActive = true;
        this.currentSessionId = sessionId;
        this.transcriptBuffer = [];
        this.questionDetector.reset();
        
        console.log('[MeetingCoach] Service started');
        if (this.onStatusUpdate) {
            this.onStatusUpdate('Meeting coach active');
        }
    }

    /**
     * Stop the meeting coach service
     */
    stop() {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;
        this.transcriptBuffer = [];
        this.currentSessionId = null;
        
        console.log('[MeetingCoach] Service stopped');
        if (this.onStatusUpdate) {
            this.onStatusUpdate('Meeting coach inactive');
        }
    }

    /**
     * Process a new transcript segment
     * @param {string} text - The transcript text
     * @param {string} speaker - The speaker ('Me', 'Them', 'unknown')
     * @param {boolean} isFinal - Whether this is a final transcript
     * @param {number} timestamp - Timestamp in milliseconds
     */
    async processTranscript(text, speaker, isFinal, timestamp = Date.now()) {
        if (!this.isActive) {
            return;
        }

        if (!text || !text.trim()) {
            return;
        }

        // For partial transcripts, update the last segment if it's from the same speaker
        // This ensures we have the most up-to-date text for context
        if (!isFinal && this.transcriptBuffer.length > 0) {
            const lastSegment = this.transcriptBuffer[this.transcriptBuffer.length - 1];
            if (lastSegment.speaker === speaker && !lastSegment.isFinal) {
                // Update the last partial segment
                lastSegment.text = text.trim();
                lastSegment.timestamp = timestamp;
                return; // Don't add a new segment, just update the existing one
            }
        }

        // Add to transcript buffer (for final transcripts or new speaker)
        const segment = {
            text: text.trim(),
            speaker,
            isFinal,
            timestamp
        };

        // If it's a final transcript, replace any partial from the same speaker
        if (isFinal && this.transcriptBuffer.length > 0) {
            const lastSegment = this.transcriptBuffer[this.transcriptBuffer.length - 1];
            if (lastSegment.speaker === speaker && !lastSegment.isFinal) {
                // Replace the partial with the final
                this.transcriptBuffer[this.transcriptBuffer.length - 1] = segment;
            } else {
                // Add as new segment
                this.transcriptBuffer.push(segment);
            }
        } else {
            // Add new segment
            this.transcriptBuffer.push(segment);
        }
        
        // Keep buffer size manageable
        if (this.transcriptBuffer.length > this.maxBufferSize) {
            this.transcriptBuffer.shift();
        }

        // Only check for questions on final transcripts to avoid false positives
        if (isFinal && this.questionDetector.shouldTriggerCoaching(text, speaker, isFinal)) {
            console.log(`[MeetingCoach] Question detected: "${text}" from ${speaker}`);
            await this.generateAnswer(text, speaker);
        }
    }

    /**
     * Manually trigger AI answer generation (for hotkey-triggered requests)
     * @param {string} question - Optional question text. If not provided, uses last transcript segment
     */
    async triggerManualAnswer(question = null) {
        if (!this.isActive) {
            throw new Error('Meeting coach is not active. Start a listen session first.');
        }

        // If no question provided, use the last transcript segment
        if (!question && this.transcriptBuffer.length > 0) {
            const lastSegment = this.transcriptBuffer[this.transcriptBuffer.length - 1];
            question = lastSegment.text;
            speaker = lastSegment.speaker;
        } else if (!question) {
            throw new Error('No transcript available. Please wait for some conversation to occur.');
        }

        // Use the last segment's speaker if question was provided manually
        const lastSegment = this.transcriptBuffer.length > 0 
            ? this.transcriptBuffer[this.transcriptBuffer.length - 1]
            : null;
        const speaker = lastSegment?.speaker || 'unknown';

        console.log(`[MeetingCoach] Manual trigger: "${question}"`);
        await this.generateAnswer(question, speaker);
    }

    /**
     * Generate an AI answer for a detected question
     * @param {string} question - The question text
     * @param {string} speaker - Who asked the question
     */
    async generateAnswer(question, speaker) {
        if (!this.isActive) {
            return;
        }

        try {
            if (this.onStatusUpdate) {
                this.onStatusUpdate('Generating answer...');
            }

            // Get full transcript for better context (use all available segments)
            const fullTranscript = this.transcriptBuffer
                .map(s => `${s.speaker}: ${s.text}`)
                .join('\n');

            // Get personalization context from presets (the "Personalize / Meeting Notes" feature)
            let personalizationContext = '';
            let selectedPresetTitle = '';
            try {
                console.log('[MeetingCoach] Loading presets...');
                const presets = await settingsService.getPresets();
                console.log(`[MeetingCoach] Found ${presets ? presets.length : 0} presets`);
                
                if (presets && presets.length > 0) {
                    // Log all presets for debugging
                    presets.forEach((p, i) => {
                        console.log(`[MeetingCoach] Preset ${i}: "${p.title}" (is_default: ${p.is_default}, is_active: ${p.is_active || 0}, prompt length: ${p.prompt ? p.prompt.length : 0})`);
                    });
                    
                    // First, try to find the active preset (is_active === 1)
                    let selectedPreset = presets.find(p => p.is_active === 1);
                    
                    if (!selectedPreset) {
                        // If no active preset, get user presets (is_default === 0) - prioritize most recent
                        const userPresets = presets.filter(p => p.is_default === 0);
                        console.log(`[MeetingCoach] No active preset found. Found ${userPresets.length} user presets (is_default === 0)`);
                        
                        selectedPreset = userPresets.length > 0 
                            ? userPresets.sort((a, b) => (b.created_at || 0) - (a.created_at || 0))[0] // Most recent user preset
                            : presets.find(p => p.is_default === 1); // Fallback to default preset
                    } else {
                        console.log(`[MeetingCoach] Found active preset: "${selectedPreset.title}"`);
                    }
                    
                    if (selectedPreset) {
                        console.log(`[MeetingCoach] Selected preset: "${selectedPreset.title}" (is_default: ${selectedPreset.is_default}, is_active: ${selectedPreset.is_active || 0})`);
                        if (selectedPreset.prompt) {
                            personalizationContext = selectedPreset.prompt;
                            selectedPresetTitle = selectedPreset.title || 'Unknown';
                            console.log(`[MeetingCoach] ✓ Using preset: "${selectedPresetTitle}" (${selectedPreset.prompt.length} chars)`);
                            console.log(`[MeetingCoach] Preset preview: ${selectedPreset.prompt.substring(0, 100)}...`);
                        } else {
                            console.warn('[MeetingCoach] ✗ Selected preset has no prompt content');
                        }
                    } else {
                        console.warn('[MeetingCoach] ✗ No preset selected');
                    }
                } else {
                    console.warn('[MeetingCoach] ✗ No presets available');
                }
            } catch (error) {
                console.error('[MeetingCoach] ✗ Error loading personalization preset:', error);
                console.error('[MeetingCoach] Error stack:', error.stack);
            }

            // Get LLM model info
            const modelInfo = await modelStateService.getCurrentModelInfo('llm');
            if (!modelInfo || !modelInfo.apiKey) {
                throw new Error('LLM model or API key not configured');
            }

            // Detect if this is a coding question
            const isCodingQuestion = /(write|code|create|build|implement|show\s+me|function|script|program|algorithm|solution)/i.test(question);

            // Detect if this is a personal question (tell me about yourself, what would you do, etc.)
            const isPersonalQuestion = /(tell\s+me\s+about\s+yourself|tell\s+us\s+about\s+yourself|what\s+would\s+you\s+do|what\s+is\s+your\s+experience|describe\s+yourself|introduce\s+yourself)/i.test(question);

            // Build prompt with context
            let systemPrompt = `You are a real-time meeting copilot. Your job is to provide instant, helpful answers when questions are asked during meetings.

CRITICAL INSTRUCTIONS:
1. For personal questions like "tell me about yourself" or "what would you do in this scenario", use the personalization context provided below to answer AS IF YOU ARE THE USER. The context contains information about the user - use it to craft a personalized answer.
2. For coding questions, provide complete, working code with proper syntax and best practices.
3. Always provide answers that are ready to use immediately - the user should be able to say "sayThis" directly in the meeting.

Response format (JSON preferred, but text is acceptable):
{
  "sayThis": "A short 1-2 sentence answer the user can say out loud immediately - this is the PRIMARY response",
  "longAnswer": "A more detailed explanation (2-4 sentences) with context - for the user's reference",
  "code": null or {"language": "python|javascript|java|etc", "snippet": "complete working code", "explain": "brief explanation of what the code does"} if coding is involved
}

${isPersonalQuestion ? 'IMPORTANT: This is a personal question. Answer using the personalization context as if you ARE the user. Use the context to provide authentic, personalized responses that the user can say directly.' : ''}
${isCodingQuestion ? 'IMPORTANT: This is a coding question. Provide complete, working code that can be used immediately. Include proper syntax, error handling, and best practices.' : ''}

Be concise, accurate, and immediately actionable. The "sayThis" field is the most important - it should be a ready-to-use response.`;

            // Add personalization context to system prompt if available
            if (personalizationContext && personalizationContext.trim().length > 0) {
                console.log(`[MeetingCoach] ✓ Adding personalization context to prompt (${personalizationContext.length} chars)`);
                systemPrompt += `\n\n=== PERSONALIZATION / MEETING NOTES (PRESET: "${selectedPresetTitle}") ===\n${personalizationContext}\n=== END PERSONALIZATION ===\n\n`;
                
                // For ALL questions (not just personal), use the preset context to provide better answers
                systemPrompt += `CRITICAL INSTRUCTION: The personalization context above contains information about the USER. When answering questions, especially personal questions like "tell me about yourself", you MUST answer AS IF YOU ARE THE USER, using the information from the personalization context. Do NOT describe yourself as an AI assistant - answer as the user would answer based on their background and experience.\n\n`;
                
                if (isPersonalQuestion) {
                    systemPrompt += `EXTREMELY IMPORTANT: This is a personal question ("${question}"). You MUST answer AS THE USER using the personalization context above. The context describes the user's background, experience, and information. Answer as if you ARE the user, not as an AI assistant. Provide a response the user can say directly in the meeting.\n\n`;
                }
            } else {
                console.warn(`[MeetingCoach] ✗ No personalization context available (context length: ${personalizationContext ? personalizationContext.length : 0})`);
                if (isPersonalQuestion) {
                    systemPrompt += `\n\nWARNING: No personalization preset found. For personal questions, provide a general professional response that can be customized. The user can add personalization via Settings > Personalize / Meeting Notes.\n\n`;
                }
            }

            let userPrompt = `Full conversation transcript:
${fullTranscript || 'No transcript available yet.'}

Question asked by ${speaker}: "${question}"

${personalizationContext ? `Use the personalization context from the system prompt to provide a response that matches the user's background and context. ` : ''}${isPersonalQuestion ? 'This is a personal question. Answer as if you are the user, using the personalization context provided in the system prompt. Provide a response the user can say directly.' : ''}
${isCodingQuestion ? 'This is a coding question. Provide complete, working code that solves the problem.' : ''}
Provide an instant, helpful answer that the user can use right now. The "sayThis" field should be a ready-to-use response the user can say out loud.`;

            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            // Call LLM with higher token limit for coding responses
            const llm = createLLM(modelInfo.provider, {
                apiKey: modelInfo.apiKey,
                model: modelInfo.model,
                temperature: 0.7,
                maxTokens: isCodingQuestion ? 2048 : 1024, // More tokens for code
                usePortkey: modelInfo.provider === 'openai-glass',
                portkeyVirtualKey: modelInfo.provider === 'openai-glass' ? modelInfo.apiKey : undefined,
            });

            // Log the full prompt being sent (for debugging)
            console.log(`[MeetingCoach] Sending to LLM:`);
            console.log(`[MeetingCoach] System prompt length: ${systemPrompt.length} chars`);
            console.log(`[MeetingCoach] User prompt length: ${userPrompt.length} chars`);
            console.log(`[MeetingCoach] Personalization included: ${personalizationContext ? 'YES' : 'NO'}`);
            if (personalizationContext) {
                console.log(`[MeetingCoach] Personalization preview: ${personalizationContext.substring(0, 200)}...`);
            }

            const startTime = Date.now();
            const response = await llm.chat(messages);
            const latencyMs = Date.now() - startTime;

            console.log(`[MeetingCoach] LLM response received in ${latencyMs}ms`);
            console.log(`[MeetingCoach] Response preview: ${(response.content || response.text || '').substring(0, 200)}...`);

            // Parse response - try to extract JSON first, then fallback to text parsing
            const parsedAnswer = this._parseLLMResponse(response.content || response.text || '', isCodingQuestion);

            const coachAnswer = {
                sessionId: this.currentSessionId,
                question,
                sayThis: parsedAnswer.sayThis,
                longAnswer: parsedAnswer.longAnswer,
                code: parsedAnswer.code || null,
                sources: [`transcript:ts=${Date.now()}`],
                latencyMs
            };

            console.log(`[MeetingCoach] Answer generated in ${latencyMs}ms`);

            // Send to UI
            if (this.onAnswerGenerated) {
                this.onAnswerGenerated(coachAnswer);
            }

            if (this.onStatusUpdate) {
                this.onStatusUpdate('Ready');
            }

        } catch (error) {
            console.error('[MeetingCoach] Error generating answer:', error);
            if (this.onStatusUpdate) {
                this.onStatusUpdate('Error generating answer');
            }
        }
    }

    /**
     * Parse LLM response into structured format
     * @param {string} responseText - The raw LLM response
     * @param {boolean} isCodingQuestion - Whether this is a coding question
     * @returns {Object} - Parsed answer with sayThis, longAnswer, and code
     */
    _parseLLMResponse(responseText, isCodingQuestion = false) {
        // First, try to parse as JSON
        try {
            // Look for JSON object in the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.sayThis || parsed.longAnswer) {
                    return {
                        sayThis: parsed.sayThis || '',
                        longAnswer: parsed.longAnswer || '',
                        code: parsed.code || null,
                        question: '',
                        sources: []
                    };
                }
            }
        } catch (e) {
            // Not valid JSON, continue with text parsing
        }

        // Fallback: parse from text format
        // Try to find "sayThis" or similar patterns
        const sayThisPatterns = [
            /\*\*sayThis\*\*:\s*(.*?)(?:\n|$)/i,
            /"sayThis":\s*"([^"]+)"/i,
            /sayThis:\s*(.*?)(?:\n|$)/i,
            /short\s+answer[:\-]?\s*(.*?)(?:\n|$)/i
        ];

        const longAnswerPatterns = [
            /\*\*longAnswer\*\*:\s*([\s\S]*?)(?:\n\n|\*\*|$)/i,
            /"longAnswer":\s*"([^"]+)"/i,
            /long\s+answer[:\-]?\s*([\s\S]*?)(?:\n\n|$)/i,
            /detailed\s+explanation[:\-]?\s*([\s\S]*?)(?:\n\n|$)/i
        ];

        let sayThis = '';
        let longAnswer = '';

        for (const pattern of sayThisPatterns) {
            const match = responseText.match(pattern);
            if (match) {
                sayThis = match[1].trim();
                break;
            }
        }

        for (const pattern of longAnswerPatterns) {
            const match = responseText.match(pattern);
            if (match) {
                longAnswer = match[1].trim();
                break;
            }
        }

        // Extract code blocks (improved regex to handle multiple languages)
        const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
        let code = null;
        const codeMatches = [...responseText.matchAll(codeBlockPattern)];
        
        if (codeMatches.length > 0) {
            // Use the first code block found
            const codeMatch = codeMatches[0];
            const language = codeMatch[1] || 'plaintext';
            const snippet = codeMatch[2].trim();
            
            // Try to extract explanation near the code block
            const explainMatch = responseText.match(new RegExp(`\`\`\`${language}\\n[\\s\\S]*?\`\`\`\\s*([^\\n]+)`, 'i'));
            const explain = explainMatch ? explainMatch[1].trim() : '';
            
            code = {
                language: language.toLowerCase(),
                snippet: snippet,
                explain: explain || (isCodingQuestion ? 'Complete working code solution' : '')
            };
        } else if (isCodingQuestion) {
            // If it's a coding question but no code block found, try to extract code-like content
            const codeLikePattern = /(function|def|class|const|let|var|public|private)\s+[\s\S]{20,}/;
            const codeLikeMatch = responseText.match(codeLikePattern);
            if (codeLikeMatch) {
                code = {
                    language: 'javascript', // Default guess
                    snippet: codeLikeMatch[0],
                    explain: 'Code extracted from response'
                };
            }
        }

        // If no structured data found, use the response as-is
        if (!sayThis && !longAnswer) {
            // Split response into first line (sayThis) and rest (longAnswer)
            const lines = responseText.trim().split('\n').filter(l => l.trim());
            sayThis = lines[0] || responseText.substring(0, 200);
            longAnswer = lines.slice(1).join('\n') || responseText;
        }

        return {
            sayThis: sayThis || responseText.split('\n')[0].trim().substring(0, 200),
            longAnswer: longAnswer || responseText.trim(),
            code: code,
            question: '',
            sources: []
        };
    }

    /**
     * Verify preset access - for testing/debugging
     * @returns {Promise<Object>} - Information about loaded preset
     */
    async verifyPresetAccess() {
        try {
            const presets = await settingsService.getPresets();
            const userPresets = presets ? presets.filter(p => p.is_default === 0) : [];
            const selectedPreset = userPresets.length > 0 
                ? userPresets.sort((a, b) => (b.created_at || 0) - (a.created_at || 0))[0]
                : null;
            
            return {
                success: true,
                totalPresets: presets ? presets.length : 0,
                userPresets: userPresets.length,
                selectedPreset: selectedPreset ? {
                    id: selectedPreset.id,
                    title: selectedPreset.title,
                    promptLength: selectedPreset.prompt ? selectedPreset.prompt.length : 0,
                    promptPreview: selectedPreset.prompt ? selectedPreset.prompt.substring(0, 100) + '...' : 'No prompt'
                } : null,
                message: selectedPreset 
                    ? `Preset "${selectedPreset.title}" is ready to use (${selectedPreset.prompt ? selectedPreset.prompt.length : 0} chars)`
                    : 'No user preset found. Create one in Settings > Personalize / Meeting Notes'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Error accessing presets: ' + error.message
            };
        }
    }

    /**
     * Get current transcript buffer (for debugging or UI display)
     */
    getTranscriptBuffer() {
        return [...this.transcriptBuffer];
    }

    /**
     * Clear transcript buffer
     */
    clearBuffer() {
        this.transcriptBuffer = [];
    }
}

module.exports = MeetingCoachService;
