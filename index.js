const { app, BrowserWindow, Menu } = require('electron');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // This allows you to use Node.js in the renderer
        },
    });

    win.loadFile('index.html');

    // Create a custom menu
    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'New File',
                    click() { console.log('New File clicked'); }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    click() { app.quit(); }
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
                { role: 'paste' }
            ]
        },
        {
            label: 'Insert',
            submenu: [
                {
                    label: 'Create DataFrame',
                    click() { console.log('Create DataFrame clicked'); }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'toggledevtools' },
                { type: 'separator' },
                { role: 'resetzoom' },
                { role: 'zoomin' },
                { role: 'zoomout' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        }
    ]);

    // Set the application menu
    Menu.setApplicationMenu(menu);
};

// Initialize the Electron app
app.whenReady().then(() => {
    createWindow();
});

// Close app when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Re-create window on macOS if dock icon is clicked and no windows are open
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
