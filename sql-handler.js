const { dialog } = require('electron');
const sqlite3 = require('sqlite3').verbose();

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
    
    // Open SQLite database using sqlite3
    const db = new sqlite3.Database(filePath, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
        return;
      }
      console.log('Connected to the SQLite database.');
    });

    // Get all tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        console.error("Error fetching tables:", err.message);
        return;
      }

      // Let user select a table
      dialog.showMessageBox({
        type: 'question',
        buttons: tables.map(t => t.name),
        defaultId: 0,
        title: 'Select Table',
        message: 'Which table would you like to import?',
        detail: `Found ${tables.length} tables in the database`
      }).then((tableResult) => {
        if (tableResult.canceled) {
          console.log('Table selection was canceled.');
          return;
        }

        const selectedTable = tables[tableResult.response].name;

        // Get table data
        db.all(`SELECT * FROM ${selectedTable} LIMIT 1000`, [], (err, data) => {
          if (err) {
            console.error("Error fetching table data:", err.message);
            return;
          }

          const columns = data.length > 0 ? Object.keys(data[0]) : [];

          // Close database after data is fetched
          db.close();

          // Return the results in an appropriate format
          return {
            headers: columns,
            rows: data.map(row => columns.map(col => row[col]))
          };
        });
      }).catch(error => {
        console.error("Error selecting table:", error.message);
        db.close();
      });
    });
  } catch (error) {
    console.error("Error during SQL import:", error);
  }
}

module.exports = { handleSQLImport };
