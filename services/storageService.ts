
import { StudentRecord, ClassConfig, ClassSessionConfig } from '../types';

const STORAGE_KEY_STUDENTS = 'edu_pro_students';
const STORAGE_KEY_CONFIG = 'edu_pro_config';
const STORAGE_KEY_SESSIONS = 'edu_pro_sessions';

const DEFAULT_CONFIG: ClassConfig[] = [
  { className: 'Toán 10', defaultPrice: 200000 },
  { className: 'Toán 11', defaultPrice: 250000 },
  { className: 'Toán 12', defaultPrice: 300000 },
  { className: 'Luyện thi ĐH', defaultPrice: 500000 },
];

export const getStudents = (): StudentRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY_STUDENTS);
  if (!data) return [];
  const students = JSON.parse(data);
  // Migration: Ensure attendance array exists
  return students.map((s: any) => ({
    ...s,
    attendance: Array.isArray(s.attendance) ? s.attendance : []
  }));
};

export const saveStudents = (students: StudentRecord[]) => {
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
};

export const getClassConfigs = (): ClassConfig[] => {
  const data = localStorage.getItem(STORAGE_KEY_CONFIG);
  return data ? JSON.parse(data) : DEFAULT_CONFIG;
};

export const saveClassConfigs = (configs: ClassConfig[]) => {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(configs));
};

export const getClassSessions = (): ClassSessionConfig[] => {
  const data = localStorage.getItem(STORAGE_KEY_SESSIONS);
  return data ? JSON.parse(data) : [];
};

export const saveClassSessions = (sessions: ClassSessionConfig[]) => {
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
};

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
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.students && Array.isArray(json.students)) {
          saveStudents(json.students);
        }
        if (json.configs && Array.isArray(json.configs)) {
          saveClassConfigs(json.configs);
        }
        if (json.sessions && Array.isArray(json.sessions)) {
          saveClassSessions(json.sessions);
        }
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
