import * as SQLite from 'expo-sqlite';

interface SQLTransaction {
  executeSql: (
    sqlStatement: string,
    args?: any[],
    callback?: SQLStatementCallback,
    errorCallback?: SQLStatementErrorCallback
  ) => void;
}

interface SQLResultSet {
  insertId?: number;
  rowsAffected: number;
  rows: SQLResultSetRowList;
}

interface SQLResultSetRowList {
  length: number;
  item(index: number): any;
  _array: any[];
}

type SQLStatementCallback = (transaction: SQLTransaction, resultSet: SQLResultSet) => void;
type SQLStatementErrorCallback = (transaction: SQLTransaction, error: SQLError) => boolean;

interface SQLError {
  code: number;
  message: string;
}

const db = SQLite.openDatabaseSync('healthSync.db');
export const initDatabase = (): void => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );
    
    db.execSync(
      `CREATE TABLE IF NOT EXISTS health_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        record_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`
    );
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
};

export const registerUser = (name: string, email: string, password: string): number => {
  try {
    const result = db.runSync('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
    console.log('User registered successfully');
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = (email: string, password: string): any => {
  try {
    const result = db.getFirstSync('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (result) {
      return result;
    } else {
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

export const getUserByEmail = (email: string): any => {
  try {
    return db.getFirstSync('SELECT * FROM users WHERE email = ?', [email]) || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

export const addHealthRecord = (userId: number, recordType: string, data: string): number => {
  try {
    const result = db.runSync('INSERT INTO health_records (user_id, record_type, data) VALUES (?, ?, ?)', [userId, recordType, data]);
    console.log('Health record added successfully');
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding health record:', error);
    throw error;
  }
};

export const getHealthRecords = (userId: number): any[] => {
  try {
    return db.getAllSync('SELECT * FROM health_records WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  } catch (error) {
    console.error('Error getting health records:', error);
    throw error;
  }
};

export const getHealthRecordsByType = (userId: number, recordType: string): any[] => {
  try {
    return db.getAllSync('SELECT * FROM health_records WHERE user_id = ? AND record_type = ? ORDER BY created_at DESC', [userId, recordType]);
  } catch (error) {
    console.error('Error getting health records by type:', error);
    throw error;
  }
};

export const updateHealthRecord = (recordId: number, data: string): void => {
  try {
    db.runSync('UPDATE health_records SET data = ? WHERE id = ?', [data, recordId]);
    console.log('Health record updated successfully');
  } catch (error) {
    console.error('Error updating health record:', error);
    throw error;
  }
};

export const deleteHealthRecord = (recordId: number): void => {
  try {
    db.runSync('DELETE FROM health_records WHERE id = ?', [recordId]);
    console.log('Health record deleted successfully');
  } catch (error) {
    console.error('Error deleting health record:', error);
    throw error;
  }
};

export const insertRecord = (tableName: string, data: Record<string, any>): number => {
  try {
    const fields: string[] = Object.keys(data);
    const values: any[] = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    
    const result = db.runSync(sql, values);
    return result.lastInsertRowId;
  } catch (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    throw error;
  }
};