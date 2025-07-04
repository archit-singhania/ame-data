import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('healthSync.db');

export const debugPrintTables = () => {
  const tables = ['users']; 

  tables.forEach((table) => {
    try {
      const schema = db.getAllSync(`PRAGMA table_info(${table})`);
      const rows = db.getAllSync(`SELECT * FROM ${table}`);

      console.log(`\n📘 TABLE: ${table.toUpperCase()}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      console.log('📐 SCHEMA:');
      schema.forEach((col: any) => {
        console.log(`  • ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
      });

      console.log('\n📦 DATA:');
      if (rows.length === 0) {
        console.log('  (No records)');
      } else {
        rows.forEach((row: any, index: number) => {
          console.log(`  🧾 Record ${index + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            console.log(`     - ${key}: ${value}`);
          });
        });
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (err) {
      console.error(`❌ Error with table '${table}':`, err);
    }
  });
};
