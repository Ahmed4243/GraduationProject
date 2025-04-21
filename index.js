const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

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