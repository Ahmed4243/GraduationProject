const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Database } = require('sqlite');

let mainWindow;

// SQL Import Handler
async function handleSQLImport() {
  try {
    // Show file dialog for SQLite files
    const result = await dialog.showOpenDialog({
      title: 'Select SQLite Database File',
      properties: ['openFile'],
      filters: [
        { name: 'SQLite Databases', extensions: ['db', 'sqlite', 'sqlite3'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    
    // Connect to SQLite database
    const db = await Database.open({
      filename: filePath,
      driver: sqlite3.Database
    });

    // Get all tables
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );

    // Let user select a table
    const tableResult = await dialog.showMessageBox({
      type: 'question',
      buttons: tables.map(t => t.name),
      defaultId: 0,
      title: 'Select Table',
      message: 'Which table would you like to import?',
      detail: `Found ${tables.length} tables in the database`
    });

    const selectedTable = tables[tableResult.response].name;

    // Get table data
    const data = await db.all(`SELECT * FROM ${selectedTable} LIMIT 1000`);
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    await db.close();

    return {
      headers: columns,
      rows: data.map(row => columns.map(col => row[col]))
    };
  } catch (error) {
    throw error;
  }
}

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'images/icon.png')
    });

    mainWindow.loadFile('index.html');

    // Open dev tools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // Create custom menu
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Project',
                    click: () => mainWindow.loadFile('newProject.html')
                },
                {
                    label: 'Open Project',
                    click: () => mainWindow.loadFile('openProject.html')
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { type: 'separator' },
                {
                    label: 'Add Row',
                    click: () => mainWindow.webContents.send('add-row')
                },
                {
                    label: 'Add Column',
                    click: () => mainWindow.webContents.send('add-column')
                }
            ]
        },
        {
            label: 'Insert',
            submenu: [
                {
                    label: 'Create DataFrame',
                    click: () => mainWindow.loadFile('DataFrame.html')
                },
                {
                    label: 'KNN Classification',
                    click: () => mainWindow.webContents.send('show-knn')
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggledevtools' },
                { type: 'separator' },
                { role: 'resetzoom' },
                { role: 'zoomin' },
                { role: 'zoomout' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                { role: 'front' }
            ]
        },
        {
            label: 'Import',
            submenu: [
                {
                    label: 'From SQL',
                    click: async () => {
                        try {
                            const data = await handleSQLImport();
                            if (data) {
                                mainWindow.webContents.send('sql-data', data);
                            }
                        } catch (error) {
                            mainWindow.webContents.send('sql-error', error.message);
                        }
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

// App lifecycle
app.whenReady().then(() => {
    createWindow();

    // Handle SQL import requests from renderer
    ipcMain.handle('import-sql', async () => {
        try {
            const data = await handleSQLImport();
            return data;
        } catch (error) {
            console.error('SQL Import Error:', error);
            throw error;
        }
    });

    // IPC Communication for KNN functionality
    ipcMain.on('reset-knn', (event) => {
        event.sender.send('knn-reset-complete');
    });

    ipcMain.on('train-knn', (event, data) => {
        // Handle KNN training from renderer
        event.sender.send('knn-training-complete', { success: true });
    });

    ipcMain.on('predict-knn', (event, data) => {
        // Handle KNN prediction from renderer
        event.sender.send('knn-prediction-complete', { success: true });
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});