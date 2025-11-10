// File: /api/photoroom.js (Bản V2 - Bản Chuẩn)

// Cấu hình để chạy function trên Vercel Edge Runtime cho tốc độ nhanh hơn
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // 1. Chỉ cho phép các yêu cầu gửi lên bằng phương thức POST
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 2. Lấy dữ liệu form được gửi từ trang web, trong đó có file ảnh
    const formData = await request.formData();
    const imageFile = formData.get('image_file');

    // Báo lỗi nếu không có file nào được gửi lên
    if (!imageFile) {
      return new Response(JSON.stringify({ detail: 'Không tìm thấy file ảnh.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Đọc API key bạn đã lưu an toàn trên Vercel Environment Variables
    const apiKey = process.env.PHOTOROOM_API_KEY;

    // Báo lỗi nếu bạn chưa cấu hình API key trên Vercel
    if (!apiKey) {
      return new Response(JSON.stringify({ detail: 'API key chưa được cấu hình trên server.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
  S   }

    // 4. Tạo một FormData mới để gửi file ảnh tới Photoroom
    const photoRoomFormData = new FormData();
    photoRoomFormData.append('image_file', imageFile);

    // 5. Chuẩn bị headers để gửi đi
    const headers = new Headers();
    headers.append('x-api-key', apiKey);

    // 6. Gọi đến API của Photoroom với file ảnh và API key
    const response = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: headers,
      body: photoRoomFormData,
    });

    // 7. Nếu Photoroom trả về lỗi, gửi thông báo lỗi đó về trang web
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ detail: `Lỗi từ Photoroom: ${errorText}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // === MÃ CHUẨN (V2) BẮT ĐẦU ===

    // 8. Nếu thành công, lấy số quota và trả về file ảnh

    // 8.1. Đọc số lượt còn lại từ header của Photoroom
    const quotaRemaining = response.headers.get('x-credits-remaining');

    // 8.2. Tạo headers mới để gửi về cho trình duyệt (frontend)
    const newHeaders = new Headers();
    newHeaders.append('Content-Type', 'image/png'); // Giữ lại content-type là ảnh
    
    // 8.3. Thêm số quota vào header mới (nếu tìm thấy)
    if (quotaRemaining) {
      newHeaders.append('X-My-Quota-Remaining', quotaRemaining);
      
      // Dòng quan trọng: Cho phép trình duyệt (frontend) đọc được header này
      newHeaders.append('Access-Control-Expose-Headers', 'X-My-Quota-Remaining');
    }

    // 8.4. Trả về kết quả (ảnh) KÈM theo các header mới
    return new Response(response.body, {
      status: 200,
      headers: newHeaders, // Sử dụng đối tượng newHeaders đã tạo
    });
    
    // === MÃ CHUẨN (V2) KẾT THÚC ===

  } catch (error) {
    // Xử lý các lỗi ngoài dự kiến khác
    console.error(error);
    return new Response(JSON.stringify({ detail: 'Có lỗi không xác định xảy ra trên server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}