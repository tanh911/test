import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';

export const PrivacyPolicy = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <button 
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-8 font-semibold text-sm"
        >
          <ArrowLeft size={16} /> Quay lại trang chủ
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-teal-50 rounded-xl">
            <Shield size={28} className="text-teal-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Chính sách Bảo mật</h1>
        </div>
        
        <p className="text-gray-500 text-sm mb-8 font-medium">Cập nhật lần cuối: 25/06/2026</p>

        <div className="space-y-8 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b pb-2">1. Thông tin chúng tôi thu thập</h2>
            <p className="text-gray-600">Khi bạn sử dụng ứng dụng <strong>Führerschein Việt-Đức</strong> và đăng nhập thông qua Facebook hoặc Google, chúng tôi chỉ thu thập các thông tin cơ bản sau từ hồ sơ công khai của bạn:</p>
            <ul className="list-disc pl-5 mt-3 text-gray-600 space-y-2">
              <li>Tên hiển thị (Display Name)</li>
              <li>Địa chỉ Email</li>
              <li>Ảnh đại diện (Avatar - nếu có)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b pb-2">2. Cách chúng tôi sử dụng thông tin</h2>
            <p className="text-gray-600">Thông tin của bạn được sử dụng duy nhất cho các mục đích sau:</p>
            <ul className="list-disc pl-5 mt-3 text-gray-600 space-y-2">
              <li>Tạo và quản lý tài khoản người dùng trên ứng dụng.</li>
              <li>Lưu trữ tiến trình học tập, lịch sử làm bài thi và danh sách câu hỏi yêu thích của bạn.</li>
              <li>Hiển thị tên của bạn trên bảng điều khiển để cá nhân hóa trải nghiệm.</li>
            </ul>
            <p className="text-gray-600 mt-3 font-medium text-red-600 bg-red-50 p-3 rounded-lg">Chúng tôi cam kết KHÔNG bán, chia sẻ hoặc tiết lộ dữ liệu cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích quảng cáo hay thương mại.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b pb-2">3. Lưu trữ và Bảo mật dữ liệu</h2>
            <p className="text-gray-600">Dữ liệu của bạn được lưu trữ an toàn thông qua nền tảng Firebase của Google. Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn để bảo vệ tài khoản của bạn khỏi việc truy cập trái phép.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b pb-2">4. Yêu cầu xóa dữ liệu (Data Deletion Request)</h2>
            <p className="text-gray-600">Nếu bạn không muốn sử dụng ứng dụng nữa và muốn xóa toàn bộ dữ liệu cá nhân của mình, bạn có thể:</p>
            <ol className="list-decimal pl-5 mt-3 text-gray-600 space-y-2">
              <li>Đăng nhập vào ứng dụng.</li>
              <li>Vào phần <strong>Cài đặt (Settings)</strong>.</li>
              <li>Chọn <strong>Xóa tài khoản</strong>. Toàn bộ tiến trình và thông tin của bạn sẽ bị xóa ngay lập tức khỏi hệ thống.</li>
            </ol>
            <p className="text-gray-600 mt-3">Ngoài ra, bạn cũng có thể gỡ bỏ quyền truy cập của ứng dụng thông qua phần Cài đặt quyền riêng tư trên tài khoản Facebook/Google của bạn.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
