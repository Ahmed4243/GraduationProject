const { ipcRenderer, contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Table operations
    addRow: () => ipcRenderer.send('add-row'),
    addColumn: () => ipcRenderer.send('add-column'),
    
    // KNN operations
    trainKNN: (data) => ipcRenderer.send('train-knn', data),
    predictKNN: (data) => ipcRenderer.send('predict-knn', data),
    resetKNN: () => ipcRenderer.send('reset-knn'),
    
    // Navigation
    navigateTo: (page) => ipcRenderer.send('navigate-to', page),
    
    // Event listeners
    onKNNReady: (callback) => ipcRenderer.on('knn-ready', callback),
    onTrainingComplete: (callback) => ipcRenderer.on('training-complete', callback),
    onPredictionComplete: (callback) => ipcRenderer.on('prediction-complete', callback),
    onResetComplete: (callback) => ipcRenderer.on('reset-complete', callback),
    
    // Utility functions
    showError: (message) => ipcRenderer.send('show-error', message),
    showMessage: (message) => ipcRenderer.send('show-message', message),
    
    // For debugging
    log: (message) => ipcRenderer.send('log', message),
    
    // SQL Import
    importFromSQL: () => ipcRenderer.send('import-sql'),
    onShowSQLTables: (callback) => ipcRenderer.on('show-sql-tables', callback),
    onSQLError: (callback) => ipcRenderer.on('sql-error', callback),
    selectSQLTable: (tableName) => ipcRenderer.send('select-sql-table', tableName),
    onSQLDataReady: (callback) => ipcRenderer.on('sql-data-ready', callback)
});

// Security: Replace the old global electron object with a more secure version
delete window.electron;
