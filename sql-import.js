const { dialog } = require('electron');
const mysql = require('mysql');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();

class SQLImporter {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
  }

  async showImportDialog() {
    const result = await dialog.showOpenDialog(this.mainWindow, {
      title: 'Connect to SQL Database',
      properties: ['openFile'],
      filters: [
        { name: 'SQLite', extensions: ['db', 'sqlite', 'sqlite3'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  }

  async connectToDatabase(dbType, connectionParams) {
    try {
      let connection;
      switch (dbType) {
        case 'mysql':
          connection = mysql.createConnection(connectionParams);
          await new Promise((resolve, reject) => {
            connection.connect(err => {
              if (err) reject(err);
              else resolve(connection);
            });
          });
          return connection;
        
        case 'postgres':
          connection = new Pool(connectionParams);
          // Test connection
          await connection.query('SELECT 1');
          return connection;
          
        case 'sqlite':
          return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(connectionParams.filename, (err) => {
              if (err) reject(err);
              else resolve(db);
            });
          });
          
        default:
          throw new Error('Unsupported database type');
      }
    } catch (error) {
      throw error;
    }
  }

  async getTables(connection, dbType) {
    try {
      let query;
      switch (dbType) {
        case 'mysql':
          query = 'SHOW TABLES';
          break;
        case 'postgres':
          query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
          break;
        case 'sqlite':
          query = "SELECT name FROM sqlite_master WHERE type='table'";
          break;
      }

      const results = await this.queryDatabase(connection, dbType, query);
      return results.map(row => Object.values(row)[0]);
    } catch (error) {
      throw error;
    }
  }

  async getTableData(connection, dbType, tableName) {
    try {
      const query = `SELECT * FROM ${this.escapeTableName(tableName, dbType)} LIMIT 1000`;
      const results = await this.queryDatabase(connection, dbType, query);
      
      if (results.length === 0) {
        return { headers: [], rows: [] };
      }
      
      const headers = Object.keys(results[0]);
      const rows = results.map(row => headers.map(header => row[header]));
      
      return { headers, rows };
    } catch (error) {
      throw error;
    }
  }

  escapeTableName(tableName, dbType) {
    switch (dbType) {
      case 'mysql':
        return `\`${tableName}\``;
      case 'postgres':
        return `"${tableName}"`;
      case 'sqlite':
        return `"${tableName}"`;
      default:
        return tableName;
    }
  }

  queryDatabase(connection, dbType, query) {
    return new Promise((resolve, reject) => {
      switch (dbType) {
        case 'mysql':
          connection.query(query, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
          break;
          
        case 'postgres':
          connection.query(query)
            .then(res => resolve(res.rows))
            .catch(err => reject(err));
          break;
          
        case 'sqlite':
          connection.all(query, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
          break;
      }
    });
  }

  closeConnection(connection, dbType) {
    switch (dbType) {
      case 'mysql':
        connection.end();
        break;
      case 'postgres':
        connection.end();
        break;
      case 'sqlite':
        connection.close();
        break;
    }
  }
}

module.exports = SQLImporter;