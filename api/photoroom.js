// File: /api/photoroom.js

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Chỉ cho phép phương thức POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Đọc API key từ biến môi trường an toàn trên Vercel
    const apiKey = process.env.PHOTOROOM_API_KEY;

    // === THÊM ĐOẠN KIỂM TRA QUAN TRỌNG NÀY ===
    // Nếu không tìm thấy API key, trả về lỗi ngay lập tức
    if (!apiKey) {
      console.error('PHOTOROOM_API_KEY is not set in Vercel environment variables.');
      return new Response(JSON.stringify({ message: 'Lỗi cấu hình server: API key chưa được thiết lập.' }), {
        status: 500, // Lỗi Server
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // ==========================================

    // Lấy dữ liệu form gửi lên, trong đó có file ảnh
    const formData = await request.formData();
    const imageFile = formData.get('image_file');

    if (!imageFile) {
      return new Response(JSON.stringify({ message: 'Không tìm thấy file ảnh.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Tạo một FormData mới để gửi tới Photoroom
    const photoRoomFormData = new FormData();
    photoRoomFormData.append('image_file', imageFile);

    // Gọi đến API của Photoroom
    const response = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: photoRoomFormData,
    });

    // Nếu Photoroom báo lỗi, gửi lỗi đó về cho người dùng
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from Photoroom API: ${response.status}`, errorText);
      // Trả về một JSON error để frontend dễ xử lý hơn
      return new Response(JSON.stringify({ detail: `Lỗi từ Photoroom: ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Nếu thành công, trả về file ảnh đã xử lý cho người dùng
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });

  } catch (error) {
    console.error('Server-side error:', error);
    return new Response(JSON.stringify({ message: 'Có lỗi không xác định xảy ra trên server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
