const { AsyncLocalStorage } = require('async_hooks');

const tenantContext = new AsyncLocalStorage();

module.exports = {
    tenantContext,
    getGymId: () => tenantContext.getStore()?.gymId,
    runWithGymId: (gymId, callback) => tenantContext.run({ gymId }, callback)
};
