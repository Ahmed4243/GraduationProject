const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // --- Main to Renderer (Listeners) ---
    onFileDataLoaded: (callback) => ipcRenderer.on('file-data-loaded', (_event, value) => callback(value)),
    onSqlFileSelected: (callback) => ipcRenderer.on('sql-file-selected', (_event, value) => callback(value)),
    onProjectSaved: (callback) => ipcRenderer.on('project-saved', (_event, value) => callback(value)),
    onProjectFileOpened: (callback) => ipcRenderer.on('project-file-opened', (_event, value) => callback(value)),
    
    // --- Renderer to Main (Actions) ---
    importExcel: () => ipcRenderer.send('import-excel'),
    importSql: () => ipcRenderer.send('import-sql'),
    saveProject: (data) => ipcRenderer.send('save-project', data),
    openProject: () => ipcRenderer.send('open-project'),
});