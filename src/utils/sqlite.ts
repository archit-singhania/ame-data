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

export interface AMERecord {
  id?: number;
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
  ame_date: string;
  present_category_awarded?: string;
  category_reason?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
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
    
    createDefaultAdmin();
    
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
};

const createDefaultAdmin = (): void => {
  try {
    const existingAdmin = db.getFirstSync('SELECT * FROM users WHERE role = ?', ['admin']);
    if (!existingAdmin) {
      db.runSync(
        'INSERT INTO users (full_name, rank, regt_id_irla_no, identity, password, role) VALUES (?, ?, ?, ?, ?, ?)',
        ['Default Admin', 'Administrator', 'ADMIN001', 'admin', 'admin123', 'admin']
      );
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

const validateIdentity = (identity: string, role: UserRole): boolean => {
  switch (role) {
    case UserRole.ADMIN:
      return identity.length >= 3;
    case UserRole.DOCTOR:
      return /^[A-Z]{2,4}\d{4,6}$/.test(identity);
    case UserRole.PERSONNEL:
      return /^[A-Z0-9]{4,10}$/.test(identity);
    default:
      return false;
  }
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password);
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

    if (!validateIdentity(identity, role)) {
      throw new Error(`Invalid identity format for ${role}`);
    }

    if (!validatePassword(password)) {
      throw new Error('Password must be at least 6 characters with letters and numbers');
    }

    const existingUser = db.getFirstSync('SELECT * FROM users WHERE identity = ?', [identity]);
    if (existingUser) {
      throw new Error('Identity already exists');
    }

    if (role === UserRole.ADMIN && identity !== password) {
      throw new Error('For admin users, identity and password must be the same');
    }

    if (role === UserRole.DOCTOR && regtIdIrlaNo !== identity) {
      throw new Error('For doctors, IRLA number must match identity');
    }

    if (role === UserRole.PERSONNEL && regtIdIrlaNo !== identity) {
      throw new Error('For personnel, IRLA/Regt no must match identity');
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
    switch (role) {
      case UserRole.ADMIN:
        if (identity !== password) {
          throw new Error('Invalid admin credentials');
        }
        break;
      case UserRole.DOCTOR:
        if (!validateIdentity(identity, UserRole.DOCTOR)) {
          throw new Error('Invalid doctor IRLA number format');
        }
        break;
      case UserRole.PERSONNEL:
        if (!validateIdentity(identity, UserRole.PERSONNEL)) {
          throw new Error('Invalid personnel IRLA/Regt number format');
        }
        break;
    }

    const result = db.getFirstSync(
      'SELECT * FROM users WHERE identity = ? AND password = ? AND role = ?',
      [identity, password, role]
    );
    
    if (result) {
      return result as User;
    } else {
      throw new Error('Invalid credentials');
    }
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

export const addHealthRecord = (userId: number, recordType: string, data: string): number => {
  try {
    const result = db.runSync('INSERT INTO health_records (user_id, record_type, data) VALUES (?, ?, ?)', [userId, recordType, data]);
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
  } catch (error) {
    console.error('Error updating health record:', error);
    throw error;
  }
};

export const deleteHealthRecord = (recordId: number): void => {
  try {
    db.runSync('DELETE FROM health_records WHERE id = ?', [recordId]);
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

export const createAMETable = (): void => {
  try {
    // db.execSync('DROP TABLE IF EXISTS ame_records');
    db.execSync(
      `CREATE TABLE IF NOT EXISTS ame_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        ame_date TEXT,
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
        personnel_id, rank, full_name, unit, age, height, weight,
        chest, waist_hip_ratio, bmi, pulse, blood_group,
        blood_pressure, vision, previous_medical_category,
        ame_date, present_category_awarded, category_reason, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        sanitizeDateValue(record.ame_date),
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
      'SELECT * FROM ame_records WHERE ame_date BETWEEN ? AND ? ORDER BY ame_date DESC',
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
      if (field === 'ame_date') {
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

export const deleteAMERecord = (id: number): void => {
  try {
    db.runSync('DELETE FROM ame_records WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting AME record:', error);
    throw error;
  }
};

export const getAMEStatistics = (): {
  total: number;
  fit: number;
  unfit: number;
  pending: number;
  fitPercentage: number;
  unfitPercentage: number;
  pendingPercentage: number;
} => {
  try {
    const total = db.getFirstSync('SELECT COUNT(*) as count FROM ame_records') as { count: number };
    const fit = db.getFirstSync('SELECT COUNT(*) as count FROM ame_records WHERE ame_status = "Fit"') as { count: number };
    const unfit = db.getFirstSync('SELECT COUNT(*) as count FROM ame_records WHERE ame_status = "Unfit"') as { count: number };
    const pending = db.getFirstSync('SELECT COUNT(*) as count FROM ame_records WHERE ame_status = "Pending"') as { count: number };

    const totalCount = total.count;
    const fitCount = fit.count;
    const unfitCount = unfit.count;
    const pendingCount = pending.count;

    return {
      total: totalCount,
      fit: fitCount,
      unfit: unfitCount,
      pending: pendingCount,
      fitPercentage: totalCount > 0 ? Math.round((fitCount / totalCount) * 100) : 0,
      unfitPercentage: totalCount > 0 ? Math.round((unfitCount / totalCount) * 100) : 0,
      pendingPercentage: totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0
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

export const getOverdueAMERecords = (): AMERecord[] => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const cutoffDate = oneYearAgo.toISOString().split('T')[0];
    
    return db.getAllSync(
      'SELECT * FROM ame_records WHERE ame_date < ? ORDER BY ame_date ASC',
      [cutoffDate]
    ) as AMERecord[];
  } catch (error) {
    console.error('Error getting overdue AME records:', error);
    throw error;
  }
};

export const getUpcomingAMERecords = (): AMERecord[] => {
  try {
    const elevenMonthsAgo = new Date();
    elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const startDate = oneYearAgo.toISOString().split('T')[0];
    const endDate = elevenMonthsAgo.toISOString().split('T')[0];
    
    return db.getAllSync(
      'SELECT * FROM ame_records WHERE ame_date BETWEEN ? AND ? ORDER BY ame_date ASC',
      [startDate, endDate]
    ) as AMERecord[];
  } catch (error) {
    console.error('Error getting upcoming AME records:', error);
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
  active: number;
  inactive: number;
  dueSoon: number;
  overdue: number;
  byCategory: { [key: string]: number };
} => {
  try {
    const total = db.getFirstSync('SELECT COUNT(*) as count FROM low_medical_records') as { count: number };
    const active = db.getFirstSync('SELECT COUNT(*) as count FROM low_medical_records WHERE status = "active"') as { count: number };
    const inactive = db.getFirstSync('SELECT COUNT(*) as count FROM low_medical_records WHERE status = "inactive"') as { count: number };
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const dueSoonDate = thirtyDaysFromNow.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    const dueSoon = db.getFirstSync(
      'SELECT COUNT(*) as count FROM low_medical_records WHERE medical_board_due_date BETWEEN ? AND ? AND status = "active"',
      [today, dueSoonDate]
    ) as { count: number };
    
    const overdue = db.getFirstSync(
      'SELECT COUNT(*) as count FROM low_medical_records WHERE medical_board_due_date < ? AND status = "active"',
      [today]
    ) as { count: number };
    
    const categoryBreakdown = db.getAllSync(
      'SELECT medical_category, COUNT(*) as count FROM low_medical_records GROUP BY medical_category'
    ) as { medical_category: string; count: number }[];
    
    const byCategory: { [key: string]: number } = {};
    categoryBreakdown.forEach(item => {
      byCategory[item.medical_category] = item.count;
    });

    return {
      total: total.count,
      active: active.count,
      inactive: inactive.count,
      dueSoon: dueSoon.count,
      overdue: overdue.count,
      byCategory
    };
  } catch (error) {
    console.error('Error getting Low Medical Category statistics:', error);
    throw error;
  }
};

export const getDueSoonLowMedicalRecords = (): LowMedicalRecord[] => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const dueSoonDate = thirtyDaysFromNow.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    return db.getAllSync(
      'SELECT * FROM low_medical_records WHERE medical_board_due_date BETWEEN ? AND ? AND status = "active" ORDER BY medical_board_due_date ASC',
      [today, dueSoonDate]
    ) as LowMedicalRecord[];
  } catch (error) {
    console.error('Error getting due soon Low Medical Category records:', error);
    throw error;
  }
};

export const getOverdueLowMedicalRecords = (): LowMedicalRecord[] => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    return db.getAllSync(
      'SELECT * FROM low_medical_records WHERE medical_board_due_date < ? AND status = "active" ORDER BY medical_board_due_date ASC',
      [today]
    ) as LowMedicalRecord[];
  } catch (error) {
    console.error('Error getting overdue Low Medical Category records:', error);
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