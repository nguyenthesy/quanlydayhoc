import { GoogleGenAI } from "@google/genai";
import { StudentRecord } from "../types";

// In a real app, this should be handled securely.
// For this frontend-only demo, we assume the key is in process.env
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzeFinancialData = async (students: StudentRecord[], month: string): Promise<string> => {
  if (!API_KEY) {
    return "Vui lòng cấu hình API Key trong môi trường để sử dụng tính năng AI.";
  }

  // Filter data to send relevant info to reduce token usage
  const relevantData = students
    .filter(s => s.month === month)
    .map(s => ({
      class: s.className,
      fee: s.totalFee,
      paid: s.isPaid,
      sessions: s.sessions
    }));

  const prompt = `
    Bạn là một trợ lý tài chính cho một trung tâm dạy thêm.
    Đây là dữ liệu học phí của tháng ${month}:
    ${JSON.stringify(relevantData)}
    
    Hãy phân tích dữ liệu này và trả về kết quả định dạng Markdown tiếng Việt gồm:
    1. **Tổng quan**: Tổng doanh thu dự kiến, thực thu, và số tiền chưa thu.
    2. **Phân tích lớp học**: Lớp nào đóng góp doanh thu cao nhất? Lớp nào có tỷ lệ nợ học phí cao nhất?
    3. **Gợi ý hành động**: 3 việc cần làm ngay để tối ưu dòng tiền.
    4. **Mẫu tin nhắn**: Viết một tin nhắn ngắn gọn, lịch sự, chuyên nghiệp để giáo viên gửi cho phụ huynh nhắc đóng học phí.
    
    Giữ giọng văn chuyên nghiệp, ngắn gọn, súc tích.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "Không thể tạo phân tích lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã xảy ra lỗi khi gọi AI. Vui lòng kiểm tra API Key hoặc thử lại sau.";
  }
};
