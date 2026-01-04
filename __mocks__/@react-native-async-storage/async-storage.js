const mockStorage = {};

module.exports = {
    setItem: jest.fn((key, value) => {
        mockStorage[key] = value;
        return Promise.resolve();
    }),
    getItem: jest.fn((key) => {
        return Promise.resolve(mockStorage[key] || null);
    }),
    removeItem: jest.fn((key) => {
        delete mockStorage[key];
        return Promise.resolve();
    }),
    clear: jest.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
        return Promise.resolve();
    }),
};
