
import React, { useState, useMemo } from 'react';
import { StudentRecord } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { analyzeFinancialData } from '../services/geminiService';
import { Loader2, BrainCircuit, Wallet, Users, AlertCircle, CheckCircle2, Filter } from 'lucide-react';

interface DashboardProps {
  students: StudentRecord[];
}

const COLORS = ['#10b981', '#f43f5e']; // Emerald-500, Rose-500

const Dashboard: React.FC<DashboardProps> = ({ students }) => {
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Get unique classes from students for the filter
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.className))).sort();
  }, [students]);

  const stats = useMemo(() => {
    // 1. Filter by Month
    let filtered = students.filter(s => s.month === currentMonth);
    
    // 2. Filter by Class (if selected)
    if (selectedClass !== 'all') {
      filtered = filtered.filter(s => s.className === selectedClass);
    }

    const total = filtered.reduce((acc, curr) => acc + curr.totalFee, 0);
    const collected = filtered.filter(s => s.isPaid).reduce((acc, curr) => acc + curr.totalFee, 0);
    const pending = total - collected;
    
    // Group by class for chart (Only relevant if 'all' is selected, otherwise shows just that class)
    const classDataMap = new Map<string, { name: string, paid: number, unpaid: number }>();
    filtered.forEach(s => {
      const existing = classDataMap.get(s.className) || { name: s.className, paid: 0, unpaid: 0 };
      if (s.isPaid) {
        existing.paid += s.totalFee;
      } else {
        existing.unpaid += s.totalFee;
      }
      classDataMap.set(s.className, existing);
    });

    return {
      total,
      collected,
      pending,
      count: filtered.length,
      paidCount: filtered.filter(s => s.isPaid).length,
      chartData: Array.from(classDataMap.values()),
      pieData: [
        { name: 'Đã thu', value: collected },
        { name: 'Chưa thu', value: pending }
      ]
    };
  }, [students, currentMonth, selectedClass]);

  const handleAiAnalyze = async () => {
    setIsAnalyzing(true);
    // Pass filtered students to AI for relevant context
    const filteredForAi = students.filter(s => 
      s.month === currentMonth && 
      (selectedClass === 'all' || s.className === selectedClass)
    );
    const result = await analyzeFinancialData(filteredForAi, currentMonth);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tổng quan tài chính</h2>
          <p className="text-sm text-slate-500 mt-1">
             {selectedClass === 'all' ? 'Toàn bộ trung tâm' : `Lớp: ${selectedClass}`} • Tháng {currentMonth}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Class Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full sm:w-40 appearance-none border border-slate-300 rounded-lg pl-10 pr-8 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50 hover:bg-white transition-colors cursor-pointer"
            >
              <option value="all">Tất cả lớp</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Filter className="w-4 h-4 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
          </div>

          <input 
            type="month" 
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
          
          <button
            onClick={handleAiAnalyze}
            disabled={isAnalyzing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-70"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            {isAnalyzing ? 'Đang phân tích...' : 'AI Phân tích'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1 duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng doanh thu</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {stats.total.toLocaleString('vi-VN')} đ
              </h3>
            </div>
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1 duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Thực thu</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {stats.collected.toLocaleString('vi-VN')} đ
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1 duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Chưa thu</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">
                {stats.pending.toLocaleString('vi-VN')} đ
              </h3>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-transform hover:-translate-y-1 duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Học sinh</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {stats.paidCount} / {stats.count} <span className="text-sm font-normal text-slate-400">đã đóng</span>
              </h3>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
          <h4 className="text-lg font-semibold text-slate-700 mb-4">Tỷ lệ thu phí</h4>
          {stats.count > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value.toLocaleString('vi-VN') + ' đ'} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">Chưa có dữ liệu</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
          <h4 className="text-lg font-semibold text-slate-700 mb-4">Doanh thu theo lớp</h4>
          {stats.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip formatter={(value: number) => value.toLocaleString('vi-VN') + ' đ'} />
                <Legend />
                <Bar dataKey="paid" name="Đã thu" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="unpaid" name="Chưa thu" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-slate-400 text-sm">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* AI Report Section */}
      {aiAnalysis && (
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-6 rounded-xl border border-indigo-100 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-4 text-indigo-800">
            <BrainCircuit className="w-6 h-6" />
            <h3 className="text-lg font-bold">Báo cáo AI Gemini</h3>
          </div>
          <div className="prose prose-sm prose-indigo max-w-none text-slate-700 whitespace-pre-line">
            {aiAnalysis}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
