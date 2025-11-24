
export interface StudentRecord {
  id: string;
  name: string;
  className: string;
  month: string; // Format YYYY-MM
  sessions: number;
  pricePerSession: number;
  totalFee: number;
  isPaid: boolean;
  note?: string;
  phone?: string;
  attendance: string[]; // Array of dates 'YYYY-MM-DD'
}

export interface ClassConfig {
  className: string;
  defaultPrice: number;
}

export interface ClassSessionConfig {
  className: string;
  month: string; // YYYY-MM
  dates: string[]; // ['2023-10-01', '2023-10-05']
}

export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  STUDENTS = 'STUDENTS',
  SETTINGS = 'SETTINGS',
}

export interface DashboardStats {
  totalRevenue: number;
  collectedRevenue: number;
  pendingRevenue: number;
  totalStudents: number;
  paidCount: number;
  unpaidCount: number;
}

export interface AIAnalysisResult {
  summary: string;
  actionableItems: string[];
  riskAnalysis: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    50: string;
    100: string;
    200: string;
    500: string;
    600: string;
    700: string;
  };
}
