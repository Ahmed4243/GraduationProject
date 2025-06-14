const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose(); // Added for SQLite support

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'images/icon.png'),
        title: "Reverie"
    });

    mainWindow.loadFile('index.html');

    // Open dev tools for debugging. Comment out for production.
    // mainWindow.webContents.openDevTools();

    // A simplified menu for a cleaner look
    const menuTemplate = [
        { role: 'appMenu' },
        { role: 'fileMenu' },
        { role: 'editMenu' },
        { role: 'viewMenu' },
        { role: 'windowMenu' }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.whenReady().then(createWindow);

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

// --- IPC Handlers for File I/O & Project Management ---

ipcMain.on('import-excel', async (event) => {
    try {
        const { filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'], filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] }]
        });
        if (filePaths && filePaths.length > 0) {
            const workbook = XLSX.readFile(filePaths[0]);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            event.reply('file-data-loaded', { success: true, headers: json[0] || [], rows: json.slice(1) || [] });
        }
    } catch(err) {
        console.error(err);
        event.reply('file-data-loaded', { success: false, error: 'Failed to read the Excel file.' });
    }
});

ipcMain.on('import-sql', async (event) => {
    try {
        const { filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'], filters: [{ name: 'SQLite Files', extensions: ['sqlite', 'db'] }]
        });
        if (filePaths && filePaths.length > 0) {
            const db = new sqlite3.Database(filePaths[0], sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    console.error(err);
                    event.reply('file-data-loaded', { success: false, error: 'Failed to open SQLite database.' });
                    return;
                }

                // Query the first table found in the database
                db.all("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1", [], (err, tables) => {
                    if (err || !tables || tables.length === 0) {
                        db.close();
                        event.reply('file-data-loaded', { success: false, error: 'No tables found in the database.' });
                        return;
                    }

                    const tableName = tables[0].name;
                    db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
                        if (err) {
                            db.close();
                            event.reply('file-data-loaded', { success: false, error: 'Failed to get table schema.' });
                            return;
                        }

                        const headers = columns.map(col => col.name);
                        db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
                            db.close();
                            if (err) {
                                event.reply('file-data-loaded', { success: false, error: 'Failed to query table data.' });
                                return;
                            }

                            // Convert rows to array of arrays (like Excel data)
                            const dataRows = rows.map(row => headers.map(header => row[header] ?? ''));
                            event.reply('file-data-loaded', { success: true, headers, rows: dataRows });
                        });
                    });
                });
            });
        } else {
            event.reply('file-data-loaded', { success: false, error: 'No file selected.' });
        }
    } catch (err) {
        console.error(err);
        event.reply('file-data-loaded', { success: false, error: 'Failed to read the SQLite file.' });
    }
});

ipcMain.on('save-project', async (event, projectData) => {
    try {
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Reverie Project',
            defaultPath: `${projectData.projectName || 'my-project'}.reverie`,
            filters: [{ name: 'Reverie Project Files', extensions: ['reverie'] }]
        });
        if (filePath) {
            fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2));
            event.reply('project-saved', { success: true, path: filePath });
        }
    } catch (err) {
        console.error(err);
        event.reply('project-saved', { success: false, error: err.message });
    }
});

ipcMain.on('open-project', async () => {
    try {
        const { filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'Open Reverie Project',
            properties: ['openFile'], filters: [{ name: 'Reverie Project Files', extensions: ['reverie'] }]
        });
        if (filePaths && filePaths.length > 0) {
            const fileContent = fs.readFileSync(filePaths[0], 'utf-8');
            const projectData = JSON.parse(fileContent);
            
            mainWindow.loadFile('newProject.html');
            mainWindow.webContents.once('did-finish-load', () => {
                 mainWindow.webContents.send('project-file-opened', { success: true, data: projectData });
            });
        }
    } catch (err) {
        console.error(err);
        mainWindow.webContents.send('project-file-opened', { success: false, error: 'Failed to open or parse project file.' });
    }
});