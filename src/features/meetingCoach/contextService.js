/**
 * Context Service
 * Manages meeting contexts that provide background information for AI answers
 */

const meetingContextRepository = require('./repositories');

class ContextService {
    constructor() {
        this.activeContext = null;
    }

    /**
     * Create a new meeting context
     * @param {string} title - Title for the context
     * @param {string} contextText - The context text
     * @param {string[]} filePaths - Array of file paths (optional)
     * @returns {Promise<string>} - The created context ID
     */
    async createContext(title, contextText, filePaths = []) {
        try {
            const contextId = await meetingContextRepository.create({
                title,
                contextText,
                filePaths
            });
            console.log(`[ContextService] Created context: ${title} (${contextId})`);
            return contextId;
        } catch (error) {
            console.error('[ContextService] Error creating context:', error);
            throw error;
        }
    }

    /**
     * Get all contexts
     * @returns {Promise<Array>}
     */
    async getAllContexts() {
        try {
            return await meetingContextRepository.getAll();
        } catch (error) {
            console.error('[ContextService] Error getting contexts:', error);
            return [];
        }
    }

    /**
     * Get active context
     * @returns {Promise<Object|null>}
     */
    async getActiveContext() {
        try {
            this.activeContext = await meetingContextRepository.getActive();
            return this.activeContext;
        } catch (error) {
            console.error('[ContextService] Error getting active context:', error);
            return null;
        }
    }

    /**
     * Set a context as active (for use in meetings)
     * @param {string} contextId - The context ID to activate, or null to deactivate all
     * @returns {Promise<boolean>}
     */
    async setActiveContext(contextId) {
        try {
            await meetingContextRepository.setActive(contextId);
            if (contextId) {
                this.activeContext = await meetingContextRepository.getById(contextId);
            } else {
                this.activeContext = null;
            }
            console.log(`[ContextService] Set active context: ${contextId || 'none'}`);
            return true;
        } catch (error) {
            console.error('[ContextService] Error setting active context:', error);
            return false;
        }
    }

    /**
     * Update a context
     * @param {string} contextId - The context ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<boolean>}
     */
    async updateContext(contextId, { title, contextText, filePaths }) {
        try {
            await meetingContextRepository.update(contextId, { title, contextText, filePaths });
            // Refresh active context if it was updated
            if (this.activeContext && this.activeContext.id === contextId) {
                this.activeContext = await meetingContextRepository.getById(contextId);
            }
            return true;
        } catch (error) {
            console.error('[ContextService] Error updating context:', error);
            return false;
        }
    }

    /**
     * Delete a context
     * @param {string} contextId - The context ID
     * @returns {Promise<boolean>}
     */
    async deleteContext(contextId) {
        try {
            await meetingContextRepository.deleteById(contextId);
            if (this.activeContext && this.activeContext.id === contextId) {
                this.activeContext = null;
            }
            console.log(`[ContextService] Deleted context: ${contextId}`);
            return true;
        } catch (error) {
            console.error('[ContextService] Error deleting context:', error);
            return false;
        }
    }

    /**
     * Get context text for use in prompts
     * Combines active context text and file contents if available
     * @returns {Promise<string>}
     */
    async getContextForPrompt() {
        if (!this.activeContext) {
            await this.getActiveContext();
        }

        if (!this.activeContext) {
            return '';
        }

        let contextText = this.activeContext.context_text || '';

        // Read file contents if filePaths are provided
        if (this.activeContext.file_paths && this.activeContext.file_paths.length > 0) {
            const fs = require('fs').promises;
            const path = require('path');
            
            const fileContents = [];
            for (const filePath of this.activeContext.file_paths) {
                try {
                    // Check if it's an absolute path or relative
                    const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
                    const stats = await fs.stat(fullPath);
                    
                    if (stats.isFile()) {
                        // Only read text files (limit to 50KB per file to avoid memory issues)
                        if (stats.size < 50 * 1024) {
                            const content = await fs.readFile(fullPath, 'utf-8');
                            const fileName = path.basename(fullPath);
                            fileContents.push(`\n\n--- File: ${fileName} ---\n${content}`);
                        } else {
                            fileContents.push(`\n\n--- File: ${path.basename(fullPath)} ---\n[File too large to include, size: ${Math.round(stats.size / 1024)}KB]`);
                        }
                    }
                } catch (err) {
                    console.warn(`[ContextService] Could not read file ${filePath}:`, err.message);
                    // Continue with other files
                }
            }
            
            if (fileContents.length > 0) {
                contextText += '\n\n--- Attached Files ---' + fileContents.join('\n');
            }
        }

        return contextText;
    }

    /**
     * Initialize - load active context on startup
     */
    async initialize() {
        try {
            await this.getActiveContext();
            if (this.activeContext) {
                console.log(`[ContextService] Active context loaded: ${this.activeContext.title}`);
            }
        } catch (error) {
            console.error('[ContextService] Error initializing:', error);
        }
    }
}

module.exports = ContextService;
