
import { StudentRecord, ClassConfig, ClassSessionConfig, FirebaseConfig } from '../types';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, get, child } from "firebase/database";

const STORAGE_KEY_STUDENTS = 'edu_pro_students';
const STORAGE_KEY_CONFIG = 'edu_pro_config';
const STORAGE_KEY_SESSIONS = 'edu_pro_sessions';
const STORAGE_KEY_FIREBASE = 'edu_pro_firebase_config';

// Initial default data for new users
const INITIAL_CONFIGS: ClassConfig[] = [
    { className: 'Toán 10', defaultPrice: 200000 },
    { className: 'Toán 11', defaultPrice: 250000 },
    { className: 'Toán 12', defaultPrice: 300000 },
    { className: 'Luyện thi ĐH', defaultPrice: 500000 },
];

let db: any = null;

// --- Firebase Initialization ---
export const initFirebase = (): boolean => {
  const configStr = localStorage.getItem(STORAGE_KEY_FIREBASE);
  if (!configStr) return false;

  try {
    const config = JSON.parse(configStr);
    if (!getApps().length) {
      const app = initializeApp(config);
      db = getDatabase(app);
    } else {
      const app = getApp();
      db = getDatabase(app);
    }
    return true;
  } catch (e) {
    console.error("Firebase Init Error", e);
    return false;
  }
};

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(config));
  initFirebase();
};

export const getFirebaseConfig = (): FirebaseConfig | null => {
  const str = localStorage.getItem(STORAGE_KEY_FIREBASE);
  return str ? JSON.parse(str) : null;
};

// --- Data Loading Strategy ---
// 1. Try to load from Cloud (if connected)
// 2. Fallback to LocalStorage
// 3. Fallback to Initial Defaults

export const loadDataFromCloud = async (): Promise<{ students: StudentRecord[], configs: ClassConfig[], sessions: ClassSessionConfig[] } | null> => {
  if (!db) {
     const initialized = initFirebase();
     if(!initialized) return null;
  }

  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, 'data'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Update Local Cache immediately for offline support next time
      if (data.students) localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(data.students));
      if (data.configs) localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(data.configs));
      if (data.sessions) localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(data.sessions));

      return {
        students: Array.isArray(data.students) ? data.students.map((s:any) => ({...s, attendance: s.attendance || []})) : [],
        configs: Array.isArray(data.configs) ? data.configs : INITIAL_CONFIGS,
        sessions: Array.isArray(data.sessions) ? data.sessions : []
      };
    }
    return null; 
  } catch (error) {
    console.error("Cloud Load Error", error);
    return null;
  }
};

// --- Local Storage Accessors ---

export const getStudents = (): StudentRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY_STUDENTS);
  if (!data) return [];
  const students = JSON.parse(data);
  return students.map((s: any) => ({
    ...s,
    attendance: Array.isArray(s.attendance) ? s.attendance : []
  }));
};

export const getClassConfigs = (): ClassConfig[] => {
  const data = localStorage.getItem(STORAGE_KEY_CONFIG);
  return data ? JSON.parse(data) : INITIAL_CONFIGS;
};

export const getClassSessions = (): ClassSessionConfig[] => {
  const data = localStorage.getItem(STORAGE_KEY_SESSIONS);
  return data ? JSON.parse(data) : [];
};

// --- Data Saving Strategy ---
// Save to LocalStorage AND Cloud (Fire-and-forget for Cloud to keep UI snappy)

export const saveAllData = async (students: StudentRecord[], configs: ClassConfig[], sessions: ClassSessionConfig[]) => {
  // 1. Save Local
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(configs));
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));

  // 2. Save Cloud (if connected)
  if (db) {
    try {
      await set(ref(db, 'data'), {
        students,
        configs,
        sessions,
        lastUpdated: new Date().toISOString()
      });
    } catch (e) {
      console.error("Cloud Save Error", e);
    }
  }
};

export const saveStudents = (students: StudentRecord[]) => {
  // Helper to save just students but trigger full save logic
  saveAllData(students, getClassConfigs(), getClassSessions());
};

export const saveClassConfigs = (configs: ClassConfig[]) => {
  saveAllData(getStudents(), configs, getClassSessions());
};

export const saveClassSessions = (sessions: ClassSessionConfig[]) => {
  saveAllData(getStudents(), getClassConfigs(), sessions);
};

// --- JSON Import/Export ---

export const exportDataToJson = () => {
  const data = {
    students: getStudents(),
    configs: getClassConfigs(),
    sessions: getClassSessions(),
    exportedAt: new Date().toISOString(),
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `edu_finance_backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export const validateAndLoadJSON = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const newStudents = (json.students && Array.isArray(json.students)) ? json.students : [];
        const newConfigs = (json.configs && Array.isArray(json.configs)) ? json.configs : [];
        const newSessions = (json.sessions && Array.isArray(json.sessions)) ? json.sessions : [];
        
        await saveAllData(newStudents, newConfigs, newSessions);
        resolve(true);
      } catch (err) {
        console.error("Invalid JSON", err);
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
};