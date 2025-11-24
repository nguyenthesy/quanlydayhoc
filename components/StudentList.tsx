
import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { StudentRecord, ClassConfig, ClassSessionConfig } from '../types';
import { getClassSessions, saveClassSessions } from '../services/storageService';
import { Search, Filter, Plus, FileSpreadsheet, Download, Trash2, Edit2, Check, X, FileUp, CalendarPlus, XCircle } from 'lucide-react';

interface StudentListProps {
  students: StudentRecord[];
  classConfigs: ClassConfig[];
  onUpdate: (students: StudentRecord[]) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, classConfigs, onUpdate }) => {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Session Management State
  const [sessionsConfig, setSessionsConfig] = useState<ClassSessionConfig[]>([]);
  const [isAddingDate, setIsAddingDate] = useState(false);
  const [newDate, setNewDate] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<StudentRecord>>({
    name: '',
    className: classConfigs[0]?.className || '',
    month: filterMonth,
    sessions: 0,
    isPaid: false,
    note: '',
    attendance: []
  });

  // Load session configs on mount
  useEffect(() => {
    setSessionsConfig(getClassSessions());
  }, []);

  // Save session configs whenever they change
  const updateSessionsConfig = (newConfigs: ClassSessionConfig[]) => {
    setSessionsConfig(newConfigs);
    saveClassSessions(newConfigs);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchClass = filterClass === 'all' || student.className === filterClass;
      const matchMonth = student.month === filterMonth;
      const studentName = student.name || '';
      const matchSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchClass && matchMonth && matchSearch;
    });
  }, [students, filterClass, filterMonth, searchTerm]);

  // Get active dates for the current view (Class + Month)
  const currentViewDates = useMemo(() => {
    if (filterClass === 'all') return [];
    const config = sessionsConfig.find(c => c.className === filterClass && c.month === filterMonth);
    return config ? config.dates.sort() : [];
  }, [sessionsConfig, filterClass, filterMonth]);

  const handleAddDate = () => {
    if (!newDate || filterClass === 'all') return;
    
    // Check if date belongs to selected month
    if (!newDate.startsWith(filterMonth)) {
        alert(`Ngày dạy phải nằm trong tháng ${filterMonth}`);
        return;
    }

    const currentConfig = sessionsConfig.find(c => c.className === filterClass && c.month === filterMonth);
    let newConfigs;

    if (currentConfig) {
      if (currentConfig.dates.includes(newDate)) {
        alert('Ngày này đã tồn tại!');
        return;
      }
      newConfigs = sessionsConfig.map(c => 
        (c.className === filterClass && c.month === filterMonth)
          ? { ...c, dates: [...c.dates, newDate].sort() }
          : c
      );
    } else {
      newConfigs = [...sessionsConfig, { className: filterClass, month: filterMonth, dates: [newDate] }];
    }

    updateSessionsConfig(newConfigs);
    setIsAddingDate(false);
    setNewDate('');
  };

  const handleDeleteDate = (dateToDelete: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa ngày dạy ${dateToDelete}? Dữ liệu điểm danh ngày này cũng sẽ mất.`)) {
        // 1. Remove date from Session Config
        const newConfigs = sessionsConfig.map(c => 
            (c.className === filterClass && c.month === filterMonth)
              ? { ...c, dates: c.dates.filter(d => d !== dateToDelete) }
              : c
        );
        updateSessionsConfig(newConfigs);

        // 2. Remove attendance record from all students in this class/month
        const updatedStudents = students.map(s => {
            if (s.className === filterClass && s.month === filterMonth && s.attendance.includes(dateToDelete)) {
                const newAttendance = s.attendance.filter(d => d !== dateToDelete);
                // Recalculate
                return {
                    ...s,
                    attendance: newAttendance,
                    sessions: newAttendance.length,
                    totalFee: newAttendance.length * s.pricePerSession
                };
            }
            return s;
        });
        onUpdate(updatedStudents);
    }
  };

  const toggleAttendance = (student: StudentRecord, date: string) => {
    const isAttended = student.attendance.includes(date);
    let newAttendance;

    if (isAttended) {
        newAttendance = student.attendance.filter(d => d !== date);
    } else {
        newAttendance = [...student.attendance, date];
    }

    // Auto calculate sessions and fee
    const newSessions = newAttendance.length;
    const newTotalFee = newSessions * student.pricePerSession;

    const updatedStudents = students.map(s => 
        s.id === student.id 
            ? { ...s, attendance: newAttendance, sessions: newSessions, totalFee: newTotalFee } 
            : s
    );
    
    onUpdate(updatedStudents);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const newStudents: StudentRecord[] = data.map((row: any) => {
        const className = row['Lớp'] || '';
        const config = classConfigs.find(c => c.className === className) || { defaultPrice: 0 };
        const sessions = Number(row['Số buổi']) || 0;
        
        return {
          id: crypto.randomUUID(),
          name: row['Họ và tên'] || '', 
          className: className,
          month: filterMonth,
          sessions: sessions,
          pricePerSession: config.defaultPrice || 0,
          totalFee: sessions * (config.defaultPrice || 0),
          isPaid: row['Trạng thái'] === 'Đã đóng',
          note: row['Ghi chú'] || '',
          attendance: [] // Default empty for imported data unless we parse columns
        };
      });

      const validStudents = newStudents.filter(s => s.name && s.className);
      onUpdate([...students, ...validStudents]);
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Họ và tên": "Nguyễn Văn A",
        "Lớp": classConfigs[0]?.className || "Toán 10",
        "Số buổi": 8,
        "Trạng thái": "Đã đóng",
        "Ghi chú": "Học sinh mới"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Lieu");
    XLSX.writeFile(wb, "Mau_Danh_Sach_Hoc_Sinh.xlsx");
  };

  const handleExportExcel = () => {
    const dataToExport = filteredStudents.map(student => {
       const base = {
        "Tháng": student.month,
        "Họ và tên": student.name,
        "Lớp": student.className,
        "Số buổi": student.sessions,
        "Đơn giá": student.pricePerSession,
        "Tổng tiền": student.totalFee,
        "Trạng thái": student.isPaid ? "Đã đóng" : "Chưa đóng",
        "Ghi chú": student.note || ''
       };
       // Add dynamic columns for dates if filtering by class
       if (filterClass !== 'all') {
           currentViewDates.forEach(date => {
               // @ts-ignore
               base[date] = student.attendance.includes(date) ? "x" : "";
           });
       }
       return base;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach");
    XLSX.writeFile(wb, `Danh_Sach_${filterClass}_${filterMonth}.xlsx`);
  };

  const handleSave = () => {
    if (!formData.name || !formData.className) return;

    const config = classConfigs.find(c => c.className === formData.className);
    const price = config ? config.defaultPrice : 0;
    // If manually editing sessions, we keep it. If generated by attendance, it stays.
    // However, for manual add, let's just calculate logic
    const total = (formData.sessions || 0) * price;

    if (editingId) {
      const updated = students.map(s => s.id === editingId ? { ...s, ...formData, pricePerSession: price, totalFee: total } as StudentRecord : s);
      onUpdate(updated);
    } else {
      const newStudent: StudentRecord = {
        id: crypto.randomUUID(),
        ...formData as StudentRecord,
        pricePerSession: price,
        totalFee: total,
        attendance: []
      };
      onUpdate([...students, newStudent]);
    }
    closeModal();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (window.confirm('Bạn có chắc muốn xóa học sinh này?')) {
      const updatedList = students.filter(s => s.id !== id);
      onUpdate(updatedList);
    }
  };

  const openModal = (student?: StudentRecord) => {
    if (student) {
      setEditingId(student.id);
      setFormData(student);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        className: filterClass === 'all' ? (classConfigs[0]?.className || '') : filterClass,
        month: filterMonth,
        sessions: 0,
        isPaid: false,
        note: '',
        attendance: []
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const togglePaymentStatus = (student: StudentRecord) => {
    const updated = students.map(s => s.id === student.id ? { ...s, isPaid: !s.isPaid } : s);
    onUpdate(updated);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Top Controls */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="month" 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <div className="relative">
            <select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none bg-white w-full sm:w-40"
            >
              <option value="all">Tất cả lớp</option>
              {classConfigs.map(c => <option key={c.className} value={c.className}>{c.className}</option>)}
            </select>
            <Filter className="w-4 h-4 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Tìm tên học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none w-full sm:w-64"
            />
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
            {filterClass !== 'all' && (
                <div className="flex items-center gap-1">
                    {isAddingDate ? (
                        <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                            <input 
                                type="date" 
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="border border-primary-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            <button onClick={handleAddDate} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setIsAddingDate(false)} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"><X className="w-4 h-4" /></button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAddingDate(true)}
                            className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                        >
                            <CalendarPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Thêm ngày dạy</span>
                        </button>
                    )}
                </div>
            )}

           <button onClick={handleDownloadTemplate} className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50" title="Tải mẫu">
             <Download className="w-4 h-4" />
           </button>

           <label className="cursor-pointer p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50" title="Nhập Excel">
             <FileSpreadsheet className="w-4 h-4" />
             <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
           </label>

           <button onClick={handleExportExcel} className="p-2 bg-white border border-slate-200 text-emerald-600 rounded-lg hover:bg-emerald-50" title="Xuất Excel">
             <FileUp className="w-4 h-4" />
           </button>
           
           <button 
             onClick={() => openModal()}
             className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
           >
             <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Thêm học sinh</span>
           </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-slate-50 z-20 w-48 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Họ và tên</th>
                <th className="px-3 py-3 w-20">Lớp</th>
                
                {/* Dynamic Date Columns */}
                {filterClass !== 'all' && currentViewDates.map(date => (
                    <th key={date} className="px-2 py-3 text-center min-w-[80px] group relative">
                        <div className="flex flex-col items-center">
                            <span className="font-semibold text-slate-700">{date.split('-')[2]}/{date.split('-')[1]}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{date.split('-')[0]}</span>
                        </div>
                        <button 
                            onClick={() => handleDeleteDate(date)}
                            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity"
                            title="Xóa ngày dạy này"
                        >
                            <XCircle className="w-4 h-4 fill-white" />
                        </button>
                    </th>
                ))}

                <th className="px-4 py-3 text-center min-w-[80px] bg-slate-50">Số buổi</th>
                {filterClass === 'all' && <th className="px-4 py-3">Đơn giá</th>}
                <th className="px-4 py-3 font-semibold text-slate-700">Thành tiền</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7 + currentViewDates.length} className="px-6 py-12 text-center text-slate-400">
                    {filterClass === 'all' 
                        ? 'Vui lòng chọn một lớp cụ thể để sử dụng tính năng điểm danh chi tiết.' 
                        : 'Không tìm thấy dữ liệu.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 font-medium text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate max-w-[200px]" title={student.name}>
                        {student.name}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold text-slate-600 whitespace-nowrap">{student.className}</span>
                    </td>

                    {/* Checkbox Cells */}
                    {filterClass !== 'all' && currentViewDates.map(date => {
                        const isChecked = student.attendance.includes(date);
                        return (
                            <td key={date} className="px-2 py-3 text-center border-l border-slate-50">
                                <button 
                                    onClick={() => toggleAttendance(student, date)}
                                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors mx-auto ${
                                        isChecked 
                                            ? 'bg-primary-500 text-white shadow-sm shadow-primary-200' 
                                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                                    }`}
                                >
                                    {isChecked && <Check className="w-4 h-4" />}
                                </button>
                            </td>
                        );
                    })}

                    <td className="px-4 py-3 text-center text-slate-700 font-medium bg-slate-50/50">
                        {student.sessions}
                    </td>
                    {filterClass === 'all' && <td className="px-4 py-3 text-slate-600">{student.pricePerSession.toLocaleString('vi-VN')}</td>}
                    <td className="px-4 py-3 font-bold text-slate-800">{student.totalFee.toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => togglePaymentStatus(student)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                          student.isPaid 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        }`}
                      >
                        {student.isPaid ? 'Đã đóng' : 'Chưa đóng'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(student)} className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDelete(student.id, e)} className="p-1.5 hover:bg-rose-50 text-rose-600 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {filterClass !== 'all' && (
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                <span>Đang hiển thị {filteredStudents.length} học sinh</span>
                <span>Tự động tính tiền: {currentViewDates.length} buổi học x Đơn giá</span>
            </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">{editingId ? 'Sửa thông tin' : 'Thêm học sinh mới'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Họ và tên</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Lớp</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.className}
                    onChange={e => setFormData({...formData, className: e.target.value})}
                  >
                     {classConfigs.map(c => <option key={c.className} value={c.className}>{c.className}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Số buổi (Ghi đè)</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.sessions}
                    onChange={e => setFormData({...formData, sessions: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Tháng</label>
                 <input 
                    type="month" 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.month}
                    onChange={e => setFormData({...formData, month: e.target.value})}
                  />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Ghi chú</label>
                <textarea 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    rows={2}
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                ></textarea>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isPaid"
                  checked={formData.isPaid}
                  onChange={e => setFormData({...formData, isPaid: e.target.checked})}
                  className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
                <label htmlFor="isPaid" className="text-sm text-slate-700">Đã đóng học phí</label>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">Hủy</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg shadow-sm">Lưu thông tin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
