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

export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PERSONNEL = 'personnel'
}

export interface User {
  id: number;
  full_name: string;
  rank: string;
  regt_id_irla_no: string;
  identity: string;
  password: string;
  role: UserRole;
  created_at: string;
}

const db = SQLite.openDatabaseSync('healthSync.db');

export const initDatabase = (): void => {
  try {
    const tableExists = db.getAllSync("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    
    if (tableExists.length > 0) {
      const tableInfo = db.getAllSync("PRAGMA table_info(users)") as { name: string }[];
      const hasRoleColumn = tableInfo.some(col => col.name === "role");
      
      if (!hasRoleColumn) {
        db.execSync("DROP TABLE IF EXISTS users");
      }
    }

    db.execSync(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        rank TEXT NOT NULL,
        regt_id_irla_no TEXT NOT NULL,
        identity TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'personnel')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`
    );

    createAMETable();
    
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
};

const validateIdentity = (identity: string, role: UserRole): boolean => {
  return /^\d{8,9}$/.test(identity);
};

export const registerUser = (
  adminId: number,
  fullName: string,
  rank: string,
  regtIdIrlaNo: string,
  identity: string,
  password: string,
  role: UserRole
): number => {
  try {
    const admin = db.getFirstSync('SELECT * FROM users WHERE id = ? AND role = ?', [adminId, 'admin']);
    if (!admin) {
      throw new Error('Only admin can register new users');
    }

    const validatePassword = (password: string): boolean => {
      return password.length >= 8 && 
            /[a-zA-Z]/.test(password) && 
            /\d/.test(password) && 
            /[!@#$%^&*(),.?":{}|<>]/.test(password);
    };

    if (!validatePassword(password)) {
      throw new Error('Password must be at least 8 characters with letters, numbers, and special characters');
    }

    const existingUser = db.getFirstSync('SELECT * FROM users WHERE identity = ?', [identity]);
    if (existingUser) {
      throw new Error('Identity already exists');
    }

    const result = db.runSync(
      'INSERT INTO users (full_name, rank, regt_id_irla_no, identity, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [fullName, rank, regtIdIrlaNo, identity, password, role]
    );
    
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = (identity: string, password: string, role: UserRole): User | null => {
  try {
    const user = db.getFirstSync(
      'SELECT * FROM users WHERE identity = ? AND password = ?',
      [identity, password]
    ) as User | null;

    if (!user) {
      throw new Error('Invalid credentials');
    }

    switch (role) {
      case UserRole.ADMIN:
        if (user.role !== UserRole.ADMIN) {
          throw new Error('Access denied: Admin privileges required');
        }
        break;

      case UserRole.DOCTOR:
        if (user.role !== UserRole.DOCTOR) {
          throw new Error('Access denied: Doctor privileges required');
        }
        if (!validateIdentity(identity, UserRole.DOCTOR)) {
          throw new Error('Invalid doctor IRLA number format');
        }
        break;

      case UserRole.PERSONNEL:
        if (user.role !== UserRole.PERSONNEL && user.role !== UserRole.ADMIN) {
          throw new Error('Access denied: Personnel privileges required');
        }
        if (!validateIdentity(identity, UserRole.PERSONNEL)) {
          throw new Error('Invalid personnel IRLA/Regt number format');
        }
        break;
    }

    return user;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

export const getUserByIdentity = (identity: string, role?: UserRole): User | null => {
  try {
    let query = 'SELECT * FROM users WHERE identity = ?';
    let params = [identity];
    
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    return db.getFirstSync(query, params) as User || null;
  } catch (error) {
    console.error('Error getting user by identity:', error);
    throw error;
  }
};

export const getAllUsers = (adminId: number): User[] => {
  try {
    const admin = db.getFirstSync('SELECT * FROM users WHERE id = ? AND role = ?', [adminId, 'admin']);
    if (!admin) {
      throw new Error('Only admin can view all users');
    }

    return db.getAllSync('SELECT * FROM users ORDER BY created_at DESC') as User[];
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

export const updateUser = (
  adminId: number,
  userId: number,
  updates: Partial<Omit<User, 'id' | 'created_at'>>
): void => {
  try {
    const admin = db.getFirstSync('SELECT * FROM users WHERE id = ? AND role = ?', [adminId, 'admin']);
    if (!admin) {
      throw new Error('Only admin can update users');
    }

    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    db.runSync(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, userId]);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = (adminId: number, userId: number): void => {
  try {
    const admin = db.getFirstSync('SELECT * FROM users WHERE id = ? AND role = ?', [adminId, 'admin']);
    if (!admin) {
      throw new Error('Only admin can delete users');
    }

    if (adminId === userId) {
      throw new Error('Admin cannot delete their own account');
    }

    db.runSync('DELETE FROM users WHERE id = ?', [userId]);
  } catch (error) {
    console.error('Error deleting user:', error);
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

export interface AMERecord {
  id?: number;
  s_no: number;
  personnel_id: string;           
  rank: string;
  full_name: string;
  unit: string;                    
  age?: number;
  height?: number;                
  weight?: number;                 
  chest?: number;                 
  waist_hip_ratio?: number;
  bmi?: number;
  pulse?: number;
  blood_group?: string;
  blood_pressure?: string;
  vision?: string;
  previous_medical_category?: string;
  date_of_ame: string;
  present_category_awarded?: string;
  category_reason?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export const createAMETable = (): void => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS ame_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        s_no INTEGER,  -- Add this line
        personnel_id TEXT,
        rank TEXT,
        full_name TEXT,
        unit TEXT,
        age INTEGER,
        height REAL,
        weight REAL,
        chest REAL,
        waist_hip_ratio REAL,
        bmi REAL,
        pulse INTEGER,
        blood_group TEXT,
        blood_pressure TEXT,
        vision TEXT,
        previous_medical_category TEXT,
        date_of_ame TEXT,
        present_category_awarded TEXT,
        category_reason TEXT,
        remarks TEXT,
        ame_status TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );`
    );
  } catch (error) {
    console.error('Error creating AME records table:', error);
    throw error;
  }
};

const sanitizeValue = (value: any): string | number => {
  if (value === undefined || value === null || value === '' || value === 0) {
    return '-';
  }
  return value;
};

const sanitizeDateValue = (value: any): string => {
  if (value === undefined || value === null || value === '') {
    return new Date().toISOString().split('T')[0];
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

export const insertAMERecord = (
  record: Omit<AMERecord, 'id' | 'created_at' | 'updated_at'>
): number => {
  try {
    const result = db.runSync(
      `INSERT INTO ame_records (
        s_no, personnel_id, rank, full_name, unit, age, height, weight,
        chest, waist_hip_ratio, bmi, pulse, blood_group,
        blood_pressure, vision, previous_medical_category,
        date_of_ame, present_category_awarded, category_reason, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sanitizeValue(record.s_no),
        record.personnel_id,
        record.rank,
        record.full_name,
        record.unit,
        sanitizeValue(record.age),
        sanitizeValue(record.height),
        sanitizeValue(record.weight),
        sanitizeValue(record.chest),
        sanitizeValue(record.waist_hip_ratio),
        sanitizeValue(record.bmi),
        sanitizeValue(record.pulse),
        sanitizeValue(record.blood_group),
        sanitizeValue(record.blood_pressure),
        sanitizeValue(record.vision),
        sanitizeValue(record.previous_medical_category),
        sanitizeDateValue(record.date_of_ame),
        sanitizeValue(record.present_category_awarded),
        sanitizeValue(record.category_reason),
        sanitizeValue(record.remarks)
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting AME record:', error);
    throw error;
  }
};

export const getAMERecords = (): AMERecord[] => {
  try {
    return db.getAllSync('SELECT * FROM ame_records ORDER BY created_at DESC') as AMERecord[];
  } catch (error) {
    console.error('Error getting AME records:', error);
    throw error;
  }
};

export const getAMERecordByPersonnelId = (personnelId: string): AMERecord | null => {
  try {
    return db.getFirstSync('SELECT * FROM ame_records WHERE personnel_id = ?', [personnelId]) as AMERecord || null;
  } catch (error) {
    console.error('Error getting AME record by personnel ID:', error);
    throw error;
  }
};

export const getAMERecordsByStatus = (status: string): AMERecord[] => {
  try {
    return db.getAllSync('SELECT * FROM ame_records WHERE ame_status = ? ORDER BY created_at DESC', [status]) as AMERecord[];
  } catch (error) {
    console.error('Error getting AME records by status:', error);
    throw error;
  }
};

export const getAMERecordsByDateRange = (startDate: string, endDate: string): AMERecord[] => {
  try {
    return db.getAllSync(
      'SELECT * FROM ame_records WHERE date_of_ame BETWEEN ? AND ? ORDER BY date_of_ame DESC',
      [startDate, endDate]
    ) as AMERecord[];
  } catch (error) {
    console.error('Error getting AME records by date range:', error);
    throw error;
  }
};

export const updateAMERecord = (id: number, updates: Partial<AMERecord>): void => {
  try {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    const values = fields.map(field => {
      const value = updates[field as keyof AMERecord];
      if (field === 'date_of_ame') {
        return sanitizeDateValue(value);
      }
      return sanitizeValue(value);
    });
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    db.runSync(`UPDATE ame_records SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
  } catch (error) {
    console.error('Error updating AME record:', error);
    throw error;
  }
};

export const deleteAMERecords = () => {
  try {
    db.runSync('DELETE FROM ame_records');
  } catch (error) {
    console.error('Error deleting AME record:', error);
    throw error;
  }
};

export const getAMEStatistics = (): {
  total: number;
  dueSoon: number;
} => {
  try {
    const ameRecords = db.getAllSync('SELECT date_of_ame FROM ame_records') as { date_of_ame: string }[];
    const total = ameRecords.length;

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const dueSoon = ameRecords.filter(record => {
      if (!record.date_of_ame) return false;
      const [day, month, year] = record.date_of_ame.split('.').map(Number);
      const ameDate = new Date(year, month - 1, day);
      return ameDate >= today && ameDate <= thirtyDaysFromNow;
    }).length;

    return {
      total,
      dueSoon
    };
  } catch (error) {
    console.error('Error getting AME statistics:', error);
    throw error;
  }
};

export const getAMERecordsByUnit = (unit: string): AMERecord[] => {
  try {
    return db.getAllSync('SELECT * FROM ame_records WHERE unit = ? ORDER BY created_at DESC', [unit]) as AMERecord[];
  } catch (error) {
    console.error('Error getting AME records by unit:', error);
    throw error;
  }
};

export const getAMERecordsByRank = (rank: string): AMERecord[] => {
  try {
    return db.getAllSync('SELECT * FROM ame_records WHERE rank = ? ORDER BY created_at DESC', [rank]) as AMERecord[];
  } catch (error) {
    console.error('Error getting AME records by rank:', error);
    throw error;
  }
};

export const getAMERecordsByMedicalCategory = (category: string): AMERecord[] => {
  try {
    return db.getAllSync('SELECT * FROM ame_records WHERE medical_category = ? ORDER BY created_at DESC', [category]) as AMERecord[];
  } catch (error) {
    console.error('Error getting AME records by medical category:', error);
    throw error;
  }
};

export const searchAMERecords = (searchTerm: string): AMERecord[] => {
  try {
    const searchPattern = `%${searchTerm}%`;
    return db.getAllSync(
      `SELECT * FROM ame_records 
       WHERE full_name LIKE ? OR personnel_id LIKE ? OR rank LIKE ? OR unit LIKE ? 
       ORDER BY created_at DESC`,
      [searchPattern, searchPattern, searchPattern, searchPattern]
    ) as AMERecord[];
  } catch (error) {
    console.error('Error searching AME records:', error);
    throw error;
  }
};

export const bulkDeleteAMERecords = (ids: number[]): void => {
  try {
    const placeholders = ids.map(() => '?').join(', ');
    db.runSync(`DELETE FROM ame_records WHERE id IN (${placeholders})`, ids);
  } catch (error) {
    console.error('Error bulk deleting AME records:', error);
    throw error;
  }
};

export const clearAllAMERecords = (): void => {
  try {
    db.runSync('DELETE FROM ame_records');
  } catch (error) {
    console.error('Error clearing all AME records:', error);
    throw error;
  }
};

export interface LowMedicalRecord {
  id?: number;
  serial_no: number;
  personnel_id: string;           
  rank: string;
  name: string;
  disease_reason: string;        
  medical_category: string;      
  category_allotment_date: string;
  last_medical_board_date: string;
  medical_board_due_date: string; 
  remarks: string;
  status: string;               
  created_at?: string;
  updated_at?: string;
}

export const createLowMedicalTable = (): void => {
  try {
    db.execSync(
      `CREATE TABLE IF NOT EXISTS low_medical_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serial_no INTEGER NOT NULL,
        personnel_id TEXT NOT NULL,
        rank TEXT NOT NULL DEFAULT '-',
        name TEXT NOT NULL,
        disease_reason TEXT DEFAULT '-',
        medical_category TEXT DEFAULT '-',
        category_allotment_date TEXT DEFAULT '-',
        last_medical_board_date TEXT DEFAULT '-',
        medical_board_due_date TEXT DEFAULT '-',
        remarks TEXT DEFAULT '-',
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );
  } catch (error) {
    console.error('Error creating Low Medical Category records table:', error);
    throw error;
  }
};

export const insertLowMedicalRecord = (
  record: Omit<LowMedicalRecord, 'id' | 'created_at' | 'updated_at'>
): number => {
  try {
    const result = db.runSync(
      `INSERT INTO low_medical_records (
        serial_no, personnel_id, rank, name, disease_reason,
        medical_category, category_allotment_date, last_medical_board_date,
        medical_board_due_date, remarks, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.serial_no,
        record.personnel_id,
        sanitizeValue(record.rank),
        record.name,
        sanitizeValue(record.disease_reason),
        sanitizeValue(record.medical_category),
        sanitizeValue(record.category_allotment_date),
        sanitizeValue(record.last_medical_board_date),
        sanitizeValue(record.medical_board_due_date),
        sanitizeValue(record.remarks),
        record.status || 'active'
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting Low Medical Category record:', error);
    throw error;
  }
};

export const getLowMedicalRecords = (): LowMedicalRecord[] => {
  try {
    return db.getAllSync('SELECT * FROM low_medical_records ORDER BY created_at DESC') as LowMedicalRecord[];
  } catch (error) {
    console.error('Error getting Low Medical Category records:', error);
    throw error;
  }
};

export const getLowMedicalRecordByPersonnelId = (personnelId: string): LowMedicalRecord | null => {
  try {
    return db.getFirstSync('SELECT * FROM low_medical_records WHERE personnel_id = ?', [personnelId]) as LowMedicalRecord || null;
  } catch (error) {
    console.error('Error getting Low Medical Category record by personnel ID:', error);
    throw error;
  }
};

export const getLowMedicalRecordsByStatus = (status: string): LowMedicalRecord[] => {
  try {
    return db.getAllSync('SELECT * FROM low_medical_records WHERE status = ? ORDER BY created_at DESC', [status]) as LowMedicalRecord[];
  } catch (error) {
    console.error('Error getting Low Medical Category records by status:', error);
    throw error;
  }
};

export const getLowMedicalRecordsByCategory = (category: string): LowMedicalRecord[] => {
  try {
    return db.getAllSync('SELECT * FROM low_medical_records WHERE medical_category = ? ORDER BY created_at DESC', [category]) as LowMedicalRecord[];
  } catch (error) {
    console.error('Error getting Low Medical Category records by category:', error);
    throw error;
  }
};

export const getLowMedicalRecordsByDateRange = (startDate: string, endDate: string): LowMedicalRecord[] => {
  try {
    return db.getAllSync(
      'SELECT * FROM low_medical_records WHERE medical_board_due_date BETWEEN ? AND ? ORDER BY medical_board_due_date ASC',
      [startDate, endDate]
    ) as LowMedicalRecord[];
  } catch (error) {
    console.error('Error getting Low Medical Category records by date range:', error);
    throw error;
  }
};

export const updateLowMedicalRecord = (id: number, updates: Partial<LowMedicalRecord>): void => {
  try {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    const values = fields.map(field => {
      const value = updates[field as keyof LowMedicalRecord];
      return sanitizeValue(value);
    });
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    db.runSync(`UPDATE low_medical_records SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
  } catch (error) {
    console.error('Error updating Low Medical Category record:', error);
    throw error;
  }
};

export const deleteLowMedicalRecord = (id: number): void => {
  try {
    db.runSync('DELETE FROM low_medical_records WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting Low Medical Category record:', error);
    throw error;
  }
};

export const getLowMedicalStatistics = (): {
  total: number;
  nextMedicalBoardAppearSoon: number;
} => {
  try {
    const lmcRecords = db.getAllSync('SELECT last_medical_board_date FROM low_medical_records') as { last_medical_board_date: string }[];
    const total = lmcRecords.length;

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const nextMedicalBoardAppearSoon = lmcRecords.filter(record => {
      if (!record.last_medical_board_date) return false;
      const [day, month, year] = record.last_medical_board_date.split('.').map(Number);
      const appearDate = new Date(year, month - 1, day);
      return appearDate >= today && appearDate <= thirtyDaysFromNow;
    }).length;

    return {
      total,
      nextMedicalBoardAppearSoon
    };
  } catch (error) {
    console.error('Error getting Low Medical statistics:', error);
    throw error;
  }
};

export const searchLowMedicalRecords = (searchTerm: string): LowMedicalRecord[] => {
  try {
    const searchPattern = `%${searchTerm}%`;
    return db.getAllSync(
      `SELECT * FROM low_medical_records 
       WHERE name LIKE ? OR personnel_id LIKE ? OR rank LIKE ? OR medical_category LIKE ? 
       ORDER BY created_at DESC`,
      [searchPattern, searchPattern, searchPattern, searchPattern]
    ) as LowMedicalRecord[];
  } catch (error) {
    console.error('Error searching Low Medical Category records:', error);
    throw error;
  }
};

export const getLowMedicalRecordsByUnit = (unit: string): LowMedicalRecord[] => {
  try {
    return db.getAllSync('SELECT * FROM low_medical_records WHERE unit = ? ORDER BY created_at DESC', [unit]) as LowMedicalRecord[];
  } catch (error) {
    console.error('Error getting Low Medical Category records by unit:', error);
    throw error;
  }
};

export const getLowMedicalRecordsByRank = (rank: string): LowMedicalRecord[] => {
  try {
    return db.getAllSync('SELECT * FROM low_medical_records WHERE rank = ? ORDER BY created_at DESC', [rank]) as LowMedicalRecord[];
  } catch (error) {
    console.error('Error getting Low Medical Category records by rank:', error);
    throw error;
  }
};

export const bulkDeleteLowMedicalRecords = (ids: number[]): void => {
  try {
    const placeholders = ids.map(() => '?').join(', ');
    db.runSync(`DELETE FROM low_medical_records WHERE id IN (${placeholders})`, ids);
  } catch (error) {
    console.error('Error bulk deleting Low Medical Category records:', error);
    throw error;
  }
};

export const clearAllLowMedicalRecords = (): void => {
  try {
    db.runSync('DELETE FROM low_medical_records');
  } catch (error) {
    console.error('Error clearing all Low Medical Category records:', error);
    throw error;
  }
};