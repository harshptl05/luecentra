/**
 * Script to add Deepgram API key to the application
 * Usage: node add-deepgram-key.js
 */

const path = require('path');
const { app } = require('electron');

// Initialize the app (required for Electron modules)
if (!app) {
    console.error('This script must be run within Electron context');
    process.exit(1);
}

async function addDeepgramKey() {
    try {
        // Import required services
        const modelStateService = require('./src/features/common/services/modelStateService');
        const authService = require('./src/features/common/services/authService');
        const databaseInitializer = require('./src/features/common/services/databaseInitializer');
        
        // Initialize database
        await databaseInitializer.initialize();
        
        // Initialize auth (creates default user if needed)
        await authService.initialize();
        
        // Initialize model state service
        await modelStateService.initialize();
        
        // Your Deepgram API key
        const deepgramApiKey = 'c6d8c29eb177bd7b0121be106e714c6197364221';
        
        console.log('Adding Deepgram API key...');
        const result = await modelStateService.setApiKey('deepgram', deepgramApiKey);
        
        if (result.success) {
            console.log('✅ Deepgram API key added successfully!');
            console.log('You can now use Deepgram for speech-to-text in your meetings.');
        } else {
            console.error('❌ Failed to add API key:', result.error);
            process.exit(1);
        }
        
        // Exit cleanly
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    addDeepgramKey();
}

module.exports = { addDeepgramKey };
