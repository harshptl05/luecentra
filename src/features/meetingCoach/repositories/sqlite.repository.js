const sqliteClient = require('../../common/services/sqliteClient');
const encryptionService = require('../../common/services/encryptionService');

function create({ uid, title, contextText, filePaths = [] }) {
    const db = sqliteClient.getDb();
    const contextId = require('crypto').randomUUID();
    const now = Math.floor(Date.now() / 1000);
    
    // Encrypt context text if encryption is available
    let encryptedText = contextText;
    try {
        if (encryptionService.isInitialized() && contextText) {
            encryptedText = encryptionService.encrypt(contextText);
        }
    } catch (err) {
        console.warn('[MeetingContext] Encryption failed, storing plain text:', err.message);
    }
    
    const query = `INSERT INTO meeting_contexts (id, uid, title, context_text, file_paths, is_active, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, 0, ?, ?)`;
    
    const filePathsJson = JSON.stringify(filePaths);
    
    try {
        db.prepare(query).run(contextId, uid, title, encryptedText, filePathsJson, now, now);
        console.log(`[MeetingContext] Created context ${contextId} for user ${uid}`);
        return contextId;
    } catch (err) {
        console.error('[MeetingContext] Failed to create context:', err);
        throw err;
    }
}

function getAll(uid) {
    const db = sqliteClient.getDb();
    const query = `SELECT id, uid, title, context_text, file_paths, is_active, created_at, updated_at 
                   FROM meeting_contexts 
                   WHERE uid = ? 
                   ORDER BY updated_at DESC`;
    
    const results = db.prepare(query).all(uid);
    
    return results.map(result => {
        // Decrypt context text if encrypted
        let decryptedText = result.context_text;
        try {
            if (decryptedText && encryptionService.looksEncrypted(decryptedText)) {
                decryptedText = encryptionService.decrypt(decryptedText);
            }
        } catch (err) {
            console.warn('[MeetingContext] Decryption failed:', err.message);
        }
        
        return {
            ...result,
            context_text: decryptedText,
            file_paths: result.file_paths ? JSON.parse(result.file_paths) : []
        };
    });
}

function getById(id) {
    const db = sqliteClient.getDb();
    const result = db.prepare('SELECT * FROM meeting_contexts WHERE id = ?').get(id);
    
    if (!result) return null;
    
    // Decrypt context text if encrypted
    let decryptedText = result.context_text;
    try {
        if (decryptedText && encryptionService.looksEncrypted(decryptedText)) {
            decryptedText = encryptionService.decrypt(decryptedText);
        }
    } catch (err) {
        console.warn('[MeetingContext] Decryption failed:', err.message);
    }
    
    return {
        ...result,
        context_text: decryptedText,
        file_paths: result.file_paths ? JSON.parse(result.file_paths) : []
    };
}

function getActive(uid) {
    const db = sqliteClient.getDb();
    const result = db.prepare('SELECT * FROM meeting_contexts WHERE uid = ? AND is_active = 1').get(uid);
    
    if (!result) return null;
    
    // Decrypt context text if encrypted
    let decryptedText = result.context_text;
    try {
        if (decryptedText && encryptionService.looksEncrypted(decryptedText)) {
            decryptedText = encryptionService.decrypt(decryptedText);
        }
    } catch (err) {
        console.warn('[MeetingContext] Decryption failed:', err.message);
    }
    
    return {
        ...result,
        context_text: decryptedText,
        file_paths: result.file_paths ? JSON.parse(result.file_paths) : []
    };
}

function update(id, { title, contextText, filePaths }) {
    const db = sqliteClient.getDb();
    const now = Math.floor(Date.now() / 1000);
    
    // Encrypt context text if encryption is available
    let encryptedText = contextText;
    try {
        if (encryptionService.isInitialized() && contextText) {
            encryptedText = encryptionService.encrypt(contextText);
        }
    } catch (err) {
        console.warn('[MeetingContext] Encryption failed, storing plain text:', err.message);
    }
    
    const filePathsJson = JSON.stringify(filePaths || []);
    
    const query = `UPDATE meeting_contexts 
                   SET title = ?, context_text = ?, file_paths = ?, updated_at = ?
                   WHERE id = ?`;
    
    const result = db.prepare(query).run(title, encryptedText, filePathsJson, now, id);
    return { changes: result.changes };
}

function setActive(uid, contextId) {
    const db = sqliteClient.getDb();
    const transaction = db.transaction(() => {
        // Deactivate all contexts for this user
        db.prepare('UPDATE meeting_contexts SET is_active = 0 WHERE uid = ?').run(uid);
        // Activate the specified context
        if (contextId) {
            db.prepare('UPDATE meeting_contexts SET is_active = 1 WHERE id = ? AND uid = ?').run(contextId, uid);
        }
    });
    
    try {
        transaction();
        return { success: true };
    } catch (err) {
        console.error('[MeetingContext] Failed to set active context:', err);
        throw err;
    }
}

function deleteById(id) {
    const db = sqliteClient.getDb();
    const result = db.prepare('DELETE FROM meeting_contexts WHERE id = ?').run(id);
    return { changes: result.changes };
}

module.exports = {
    create,
    getAll,
    getById,
    getActive,
    update,
    setActive,
    deleteById
};
