import { openDatabaseSync } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const db = openDatabaseSync('medical_records.db');

// Helper to get all rows from a table
const getAllRows = async (tableName: string): Promise<any[]> => {
  try {
    const result = db.getAllSync(`SELECT * FROM ${tableName};`);
    return result ?? [];
  } catch (error) {
    console.error(`Error fetching from ${tableName}:`, error);
    return [];
  }
};

// ✅ Export as JSON
export const exportDatabase = async (returnDataOnly = false) => {
  const tables = ['ame_records', 'low_medical_records', 'prescriptions'];
  const exportData: Record<string, any[]> = {};

  for (const table of tables) {
    exportData[table] = await getAllRows(table);
  }

  if (returnDataOnly) {
    return exportData;
  }

  const fileUri = FileSystem.documentDirectory + 'db_export.json';
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(fileUri);
};


// ✅ Import from JSON
export const importDatabase = async (importedData: Record<string, any[]>) => {
  try {
    // Use transaction for better performance and data integrity
    db.withTransactionSync(() => {
      for (const [table, rows] of Object.entries(importedData)) {
        for (const row of rows) {
          const keys = Object.keys(row);
          const values = Object.values(row);
          const placeholders = keys.map(() => '?').join(',');
          const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${placeholders});`;
          
          db.runSync(sql, values as (string | number | null)[]);
        }
      }
    });
    
    console.log('Database import completed successfully');
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
};

// ✅ Additional utility functions for the new API
export const executeQuery = (sql: string, params: any[] = []) => {
  try {
    return db.getAllSync(sql, params);
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
};

export const executeUpdate = (sql: string, params: any[] = []) => {
  try {
    return db.runSync(sql, params);
  } catch (error) {
    console.error('Update execution failed:', error);
    throw error;
  }
};