/**
 * Question Detector Utility
 * Detects questions in transcript text to trigger AI coaching responses
 */

class QuestionDetector {
    constructor() {
        // Question patterns that indicate a question is being asked
        this.questionPatterns = [
            /^what\s+(is|are|was|were|does|do|did|will|would|can|could|should|may|might)/i,
            /^why\s+(is|are|was|were|does|do|did|will|would|can|could|should|may|might)/i,
            /^how\s+(is|are|was|were|does|do|did|will|would|can|could|should|may|might|would\s+you)/i,
            /^when\s+(is|are|was|were|does|do|did|will|would|can|could|should|may|might)/i,
            /^where\s+(is|are|was|were|does|do|did|will|would|can|could|should|may|might)/i,
            /^who\s+(is|are|was|were|does|do|did|will|would|can|could|should|may|might)/i,
            /^can\s+you\s+(explain|tell|describe|show|help|clarify)/i,
            /^could\s+you\s+(explain|tell|describe|show|help|clarify)/i,
            /^would\s+you\s+(explain|tell|describe|show|help|clarify|mind)/i,
            /^do\s+you\s+(know|understand|think|have|remember)/i,
            /^does\s+(anyone|somebody|someone)\s+(know|understand|think|have|remember)/i,
            /^walk\s+me\s+through/i,
            /^tell\s+me\s+(about|more|how|what|why|yourself)/i,
            /^explain\s+(to\s+me\s+)?(how|what|why|when|where)/i,
            // Personal questions
            /tell\s+me\s+about\s+yourself/i,
            /tell\s+us\s+about\s+yourself/i,
            /tell\s+me\s+about\s+you/i,
            /what\s+would\s+you\s+do/i,
            /what\s+do\s+you\s+think/i,
            /how\s+would\s+you\s+handle/i,
            /how\s+would\s+you\s+approach/i,
            /what\s+is\s+your\s+(experience|background|approach|opinion|take)/i,
            /describe\s+yourself/i,
            /introduce\s+yourself/i,
            // Coding questions
            /(write|code|create|build|implement|show\s+me)\s+(a|an|the|some)?\s*(function|code|script|program|algorithm|solution)/i,
            /(how\s+to|how\s+do\s+you|can\s+you)\s+(write|code|implement|create|build)/i,
            /(write|code|create)\s+(me|us)?\s+(a|an|the)?\s*(function|code|script|program)/i,
            /(show|give)\s+(me|us)\s+(the|some)?\s*(code|function|script|implementation)/i,
            /\?$/  // Ends with question mark
        ];

        // Debounce window to prevent multiple triggers for the same question
        this.lastQuestionTimestamp = 0;
        this.debounceWindowMs = 3000; // 3 seconds
    }

    /**
     * Checks if a text segment contains a question
     * @param {string} text - The text to check
     * @param {string} speaker - The speaker ('Me', 'Them', 'unknown')
     * @returns {boolean} - True if a question is detected
     */
    isQuestion(text, speaker = 'unknown') {
        if (!text || typeof text !== 'string') {
            return false;
        }

        const trimmedText = text.trim();
        if (trimmedText.length < 3) {
            return false;
        }

        // Check if text ends with question mark
        const endsWithQuestionMark = trimmedText.endsWith('?');

        // Check if text matches any question pattern
        const matchesPattern = this.questionPatterns.some(pattern => pattern.test(trimmedText));

        // For questions directed at the user, prefer detecting "Them" speaker questions
        // But also allow "Me" questions if they're asking something
        const isQuestion = endsWithQuestionMark || matchesPattern;

        // Additional check: if speaker is "Them" and text seems like a question, it's likely directed at user
        if (isQuestion && speaker === 'Them') {
            return true;
        }

        // If it's "Me" speaking, only trigger if it's clearly a question
        if (isQuestion && speaker === 'Me') {
            // User might be asking themselves or the AI, so allow it
            return true;
        }

        return isQuestion;
    }

    /**
     * Checks if enough time has passed since the last question (debounce)
     * @param {number} currentTime - Current timestamp in milliseconds
     * @returns {boolean} - True if debounce window has passed
     */
    shouldTrigger(currentTime = Date.now()) {
        const timeSinceLastQuestion = currentTime - this.lastQuestionTimestamp;
        
        if (timeSinceLastQuestion >= this.debounceWindowMs) {
            this.lastQuestionTimestamp = currentTime;
            return true;
        }
        
        return false;
    }

    /**
     * Resets the debounce timer (useful when starting a new session)
     */
    reset() {
        this.lastQuestionTimestamp = 0;
    }

    /**
     * Main method to check if we should trigger a coaching response
     * @param {string} text - The transcript text
     * @param {string} speaker - The speaker
     * @param {boolean} isFinal - Whether this is a final transcript (not interim)
     * @returns {boolean} - True if we should trigger coaching
     */
    shouldTriggerCoaching(text, speaker, isFinal = true) {
        // Only trigger on final transcripts to avoid false positives
        if (!isFinal) {
            return false;
        }

        // Check if it's a question
        if (!this.isQuestion(text, speaker)) {
            return false;
        }

        // Check debounce window
        if (!this.shouldTrigger()) {
            return false;
        }

        return true;
    }
}

module.exports = QuestionDetector;
