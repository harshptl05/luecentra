const { getFirestore } = require('../../common/services/firebaseClient');
const { createEncryptedConverter } = require('../../common/repositories/firestoreConverter');
const encryptionService = require('../../common/services/encryptionService');

function contextsCol(uid) {
    const db = getFirestore();
    return db.collection('users').doc(uid).collection('meeting_contexts');
}

async function create({ uid, title, contextText, filePaths = [] }) {
    const contextId = require('crypto').randomUUID();
    const now = Math.floor(Date.now() / 1000);
    
    const contextData = {
        id: contextId,
        uid,
        title,
        context_text: contextText, // Will be encrypted by converter
        file_paths: filePaths,
        is_active: false,
        created_at: now,
        updated_at: now,
        sync_state: 'clean'
    };
    
    try {
        const converter = createEncryptedConverter(['context_text']);
        await contextsCol(uid).doc(contextId).withConverter(converter).set(contextData);
        console.log(`[MeetingContext] Created context ${contextId} for user ${uid} in Firebase`);
        return contextId;
    } catch (err) {
        console.error('[MeetingContext] Failed to create context in Firebase:', err);
        throw err;
    }
}

async function getAll(uid) {
    try {
        const converter = createEncryptedConverter(['context_text']);
        const snapshot = await contextsCol(uid).withConverter(converter).orderBy('updated_at', 'desc').get();
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                file_paths: data.file_paths || []
            };
        });
    } catch (err) {
        console.error('[MeetingContext] Failed to get contexts from Firebase:', err);
        throw err;
    }
}

async function getById(id, uid) {
    try {
        const converter = createEncryptedConverter(['context_text']);
        const doc = await contextsCol(uid).doc(id).withConverter(converter).get();
        if (!doc.exists) return null;
        
        const data = doc.data();
        return {
            ...data,
            file_paths: data.file_paths || []
        };
    } catch (err) {
        console.error('[MeetingContext] Failed to get context from Firebase:', err);
        throw err;
    }
}

async function getActive(uid) {
    try {
        const converter = createEncryptedConverter(['context_text']);
        const snapshot = await contextsCol(uid)
            .withConverter(converter)
            .where('is_active', '==', true)
            .limit(1)
            .get();
        
        if (snapshot.empty) return null;
        
        const data = snapshot.docs[0].data();
        return {
            ...data,
            file_paths: data.file_paths || []
        };
    } catch (err) {
        console.error('[MeetingContext] Failed to get active context from Firebase:', err);
        throw err;
    }
}

async function update(id, { title, contextText, filePaths }, uid) {
    const now = Math.floor(Date.now() / 1000);
    
    const updateData = {
        title,
        context_text: contextText, // Will be encrypted by converter
        file_paths: filePaths || [],
        updated_at: now
    };
    
    try {
        const converter = createEncryptedConverter(['context_text']);
        await contextsCol(uid).doc(id).withConverter(converter).update(updateData);
        return { changes: 1 };
    } catch (err) {
        console.error('[MeetingContext] Failed to update context in Firebase:', err);
        throw err;
    }
}

async function setActive(uid, contextId) {
    try {
        const batch = getFirestore().batch();
        
        // Deactivate all contexts
        const allContexts = await contextsCol(uid).get();
        allContexts.docs.forEach(doc => {
            batch.update(doc.ref, { is_active: false });
        });
        
        // Activate the specified context
        if (contextId) {
            batch.update(contextsCol(uid).doc(contextId), { is_active: true });
        }
        
        await batch.commit();
        return { success: true };
    } catch (err) {
        console.error('[MeetingContext] Failed to set active context in Firebase:', err);
        throw err;
    }
}

async function deleteById(id, uid) {
    try {
        await contextsCol(uid).doc(id).delete();
        return { changes: 1 };
    } catch (err) {
        console.error('[MeetingContext] Failed to delete context from Firebase:', err);
        throw err;
    }
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
