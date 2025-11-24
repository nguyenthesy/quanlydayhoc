
import React, { useState, useEffect } from 'react';
import { getStudents, saveStudents, getClassConfigs, saveClassConfigs, loadDataFromCloud, saveAllData, getClassSessions, saveClassSessions } from './services/storageService';
import { StudentRecord, ViewState, ClassConfig, Theme } from './types';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import Settings from './components/Settings';
import { LayoutDashboard, Users, Settings as SettingsIcon, LogOut, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';

const THEMES: Theme[] = [
  {
    id: 'blue',
    name: 'Xanh Đại Dương',
    colors: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' }
  },
  {
    id: 'violet',
    name: 'Tím Mộng Mơ',
    colors: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' }
  },
  {
    id: 'emerald',
    name: 'Xanh Ngọc Lục Bảo',
    colors: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 500: '#10b981', 600: '#059669', 700: '#047857' }
  },
  {
    id: 'rose',
    name: 'Hồng Quyến Rũ',
    colors: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c' }
  },
  {
    id: 'amber',
    name: 'Vàng Hổ Phách',
    colors: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' }
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [configs, setConfigs] = useState<ClassConfig[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
  
  // Data Loading State
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Theme State
  const [currentThemeId, setCurrentThemeId] = useState<string>('blue');

  // Initial Data Load (Try Cloud -> Fallback Local)
  useEffect(() => {
    const fetchData = async () => {
        setIsLoadingData(true);
        // Try loading from cloud first
        const cloudData = await loadDataFromCloud();
        
        if (cloudData) {
            setStudents(cloudData.students);
            setConfigs(cloudData.configs);
            saveAllData(cloudData.students, cloudData.configs, cloudData.sessions); // Sync back to local to ensure consistency
        } else {
            // Fallback to local
            setStudents(getStudents());
            setConfigs(getClassConfigs());
        }
        
        const savedTheme = localStorage.getItem('edu_pro_theme');
        if (savedTheme) setCurrentThemeId(savedTheme);
        
        setIsLoadingData(false);
        setIsDataLoaded(true);
    };

    fetchData();
  }, []);

  // Save Data Effect - Only save if data has been initially loaded to prevent overwriting with empty state
  useEffect(() => {
    if (view !== ViewState.LOGIN && isDataLoaded) {
      saveStudents(students); // This now triggers Cloud Save as well in storageService
    }
  }, [students, isDataLoaded, view]);
  
  // Separate effect for Configs to avoid double saving loops, but simplifed for this demo
  useEffect(() => {
      if (view !== ViewState.LOGIN && isDataLoaded) {
          saveClassConfigs(configs);
      }
  }, [configs, isDataLoaded, view]);

  // Apply Theme Effect
  useEffect(() => {
    const theme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];
    const root = document.documentElement;
    root.style.setProperty('--primary-50', theme.colors[50]);
    root.style.setProperty('--primary-100', theme.colors[100]);
    root.style.setProperty('--primary-200', theme.colors[200]);
    root.style.setProperty('--primary-500', theme.colors[500]);
    root.style.setProperty('--primary-600', theme.colors[600]);
    root.style.setProperty('--primary-700', theme.colors[700]);
    localStorage.setItem('edu_pro_theme', currentThemeId);
  }, [currentThemeId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (username === 'admin' && password === 'abcd@123') {
      setCurrentUser('Quản trị viên');
      setView(ViewState.DASHBOARD);
    } else if (username === 'nguyenthesy' && password === '14111999@') {
      setCurrentUser('Nguyễn Thế Sỹ');
      setView(ViewState.DASHBOARD);
    } else {
      setLoginError('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }
  };

  const handleLogout = () => {
    setView(ViewState.LOGIN);
    setUsername('');
    setPassword('');
    setCurrentUser('');
  };

  if (isLoadingData) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                  <p className="text-slate-600 font-medium">Đang đồng bộ dữ liệu...</p>
              </div>
          </div>
      )
  }

  if (view === ViewState.LOGIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 transition-colors duration-500">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-primary-600 p-8 text-center transition-colors duration-500">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">EduFinance Pro</h1>
            <p className="text-primary-100 text-sm mt-2">Hệ thống quản lý học phí hiện đại</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4" />
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-primary-600 text-white font-medium py-2.5 rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 mt-2"
              >
                Đăng nhập
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 transition-colors duration-500">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-20">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-500">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg">EduFinance</span>
        </div>
        
        <div className="px-6 py-4">
           <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Xin chào</p>
           <p className="font-medium text-slate-800 truncate">{currentUser}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setView(ViewState.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${view === ViewState.DASHBOARD ? 'bg-primary-50 text-primary-700 translate-x-1' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Tổng quan
          </button>
          <button 
            onClick={() => setView(ViewState.STUDENTS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${view === ViewState.STUDENTS ? 'bg-primary-50 text-primary-700 translate-x-1' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Users className="w-5 h-5" /> Quản lý học sinh
          </button>
          <button 
            onClick={() => setView(ViewState.SETTINGS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${view === ViewState.SETTINGS ? 'bg-primary-50 text-primary-700 translate-x-1' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <SettingsIcon className="w-5 h-5" /> Cấu hình
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col h-screen">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center md:hidden sticky top-0 z-10 shrink-0">
          <span className="font-bold text-slate-800">EduFinance Pro</span>
          <button onClick={handleLogout} className="text-slate-500"><LogOut className="w-5 h-5" /></button>
        </header>
        
        {/* Mobile Tab Bar */}
        <div className="md:hidden flex overflow-x-auto bg-white border-b border-slate-200 px-4 gap-2 py-2 shrink-0">
            <button onClick={() => setView(ViewState.DASHBOARD)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${view === ViewState.DASHBOARD ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}>Tổng quan</button>
            <button onClick={() => setView(ViewState.STUDENTS)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${view === ViewState.STUDENTS ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}>Học sinh</button>
            <button onClick={() => setView(ViewState.SETTINGS)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${view === ViewState.SETTINGS ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}>Cấu hình</button>
        </div>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {view === ViewState.DASHBOARD && <Dashboard students={students} />}
          {view === ViewState.STUDENTS && <StudentList students={students} classConfigs={configs} onUpdate={setStudents} />}
          {view === ViewState.SETTINGS && (
            <Settings 
              configs={configs} 
              onSave={setConfigs} 
              themes={THEMES}
              currentThemeId={currentThemeId}
              onThemeChange={setCurrentThemeId}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;