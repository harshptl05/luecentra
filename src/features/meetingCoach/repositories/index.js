const sqliteRepository = require('./sqlite.repository');
const firebaseRepository = require('./firebase.repository');
const authService = require('../../common/services/authService');

function getBaseRepository() {
    const user = authService.getCurrentUser();
    if (user && user.isLoggedIn) {
        return firebaseRepository;
    }
    return sqliteRepository;
}

const meetingContextRepository = {
    create: async ({ title, contextText, filePaths = [] }) => {
        const uid = authService.getCurrentUserId();
        const baseRepo = getBaseRepository();
        return await baseRepo.create({ uid, title, contextText, filePaths });
    },
    
    getAll: async () => {
        const uid = authService.getCurrentUserId();
        const baseRepo = getBaseRepository();
        return await baseRepo.getAll(uid);
    },
    
    getById: async (id) => {
        const uid = authService.getCurrentUserId();
        const baseRepo = getBaseRepository();
        if (baseRepo === firebaseRepository) {
            return await baseRepo.getById(id, uid);
        }
        return await baseRepo.getById(id);
    },
    
    getActive: async () => {
        const uid = authService.getCurrentUserId();
        const baseRepo = getBaseRepository();
        return await baseRepo.getActive(uid);
    },
    
    update: async (id, { title, contextText, filePaths }) => {
        const uid = authService.getCurrentUserId();
        const baseRepo = getBaseRepository();
        if (baseRepo === firebaseRepository) {
            return await baseRepo.update(id, { title, contextText, filePaths }, uid);
        }
        return await baseRepo.update(id, { title, contextText, filePaths });
    },
    
    setActive: async (contextId) => {
        const uid = authService.getCurrentUserId();
        const baseRepo = getBaseRepository();
        return await baseRepo.setActive(uid, contextId);
    },
    
    deleteById: async (id) => {
        const uid = authService.getCurrentUserId();
        const baseRepo = getBaseRepository();
        if (baseRepo === firebaseRepository) {
            return await baseRepo.deleteById(id, uid);
        }
        return await baseRepo.deleteById(id);
    }
};

module.exports = meetingContextRepository;
