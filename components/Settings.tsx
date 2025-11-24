import React, { useState } from 'react';
import { ClassConfig, Theme } from '../types';
import { exportDataToJson } from '../services/storageService';
import { Plus, Trash2, Save, Download, Palette, Check } from 'lucide-react';

interface SettingsProps {
  configs: ClassConfig[];
  onSave: (configs: ClassConfig[]) => void;
  themes: Theme[];
  currentThemeId: string;
  onThemeChange: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ configs, onSave, themes, currentThemeId, onThemeChange }) => {
  const [localConfigs, setLocalConfigs] = useState<ClassConfig[]>(configs);
  const [newClass, setNewClass] = useState('');
  const [newPrice, setNewPrice] = useState(200000);

  const handleUpdatePrice = (index: number, price: number) => {
    const updated = [...localConfigs];
    updated[index].defaultPrice = price;
    setLocalConfigs(updated);
  };

  const handleAddClass = () => {
    if (newClass && !localConfigs.find(c => c.className === newClass)) {
      setLocalConfigs([...localConfigs, { className: newClass, defaultPrice: newPrice }]);
      setNewClass('');
      setNewPrice(200000);
    }
  };

  const handleDeleteClass = (index: number) => {
    setLocalConfigs(localConfigs.filter((_, i) => i !== index));
  };

  const handleSaveAll = () => {
    onSave(localConfigs);
    alert('Đã lưu cấu hình thành công!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Theme Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-bold text-slate-800">Giao diện người dùng</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Chọn màu sắc chủ đạo cho ứng dụng theo sở thích của bạn.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`relative group p-4 rounded-xl border transition-all ${
                currentThemeId === theme.id 
                  ? 'border-slate-800 bg-slate-50 ring-1 ring-slate-800' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full shadow-sm flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: theme.colors[500] }}
                >
                  {currentThemeId === theme.id && <Check className="w-6 h-6 text-white" />}
                </div>
                <span className={`text-sm font-medium ${currentThemeId === theme.id ? 'text-slate-800' : 'text-slate-600'}`}>
                  {theme.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Class Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Cấu hình Học phí</h2>
            <p className="text-sm text-slate-500">Thiết lập đơn giá mặc định cho từng lớp học.</p>
          </div>
          <button 
            onClick={handleSaveAll}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" /> Lưu thay đổi
          </button>
        </div>

        <div className="space-y-4">
          {localConfigs.map((config, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="w-1/3">
                <span className="font-medium text-slate-700">{config.className}</span>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    value={config.defaultPrice}
                    onChange={(e) => handleUpdatePrice(index, Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg pl-3 pr-12 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-sm text-slate-500">vnđ</span>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteClass(index)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Thêm lớp mới</h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Tên lớp (VD: Lý 10)"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="w-40 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <button 
              onClick={handleAddClass}
              disabled={!newClass}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Thêm
            </button>
          </div>
        </div>
      </div>

      {/* Backup */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Sao lưu dữ liệu</h2>
        <p className="text-sm text-slate-500 mb-4">Tải xuống toàn bộ dữ liệu học sinh và cấu hình về máy dưới dạng JSON.</p>
        <button 
          onClick={exportDataToJson}
          className="flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" /> Xuất file JSON
        </button>
      </div>
    </div>
  );
};

export default Settings;