// File: /api/photoroom.js (Bản "Chẩn đoán V4")
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get('image_file');
    if (!imageFile) {
      return new Response(JSON.stringify({ detail: 'Không tìm thấy file ảnh.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.PHOTOROOM_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ detail: 'API key chưa được cấu hình trên server.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const photoRoomFormData = new FormData();
    photoRoomFormData.append('image_file', imageFile);
    const headers = new Headers();
    headers.append('x-api-key', apiKey);

    // Gọi Photoroom
    const response = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: headers,
      body: photoRoomFormData,
    });

    // Xử lý lỗi
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ detail: `Lỗi từ Photoroom: ${errorText}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // === PHẦN CHẨN ĐOÁN MỚI ===
    
    // 1. Lấy quota từ Photoroom
    const quotaRemaining = response.headers.get('x-credits-remaining');
    
    // 2. Tạo headers mới để gửi về trình duyệt
    const newHeaders = new Headers();
    newHeaders.append('Content-Type', 'image/png');
    
    // 3. Thêm các header DEBUG (luôn luôn thêm)
    newHeaders.append('X-Debug-Status', 'Code-Moi-Da-Chay-V4'); // "Dấu hiệu" code mới
    
    let exposedHeaders = 'X-Debug-Status, X-Debug-Quota'; // Các header cần cho trình duyệt thấy

    if (quotaRemaining) {
      // 4a. Nếu TÌM THẤY quota
      newHeaders.append('X-My-Quota-Remaining', quotaRemaining);
      newHeaders.append('X-Debug-Quota', `Tim_Thay_Quota:_${quotaRemaining}`);
      exposedHeaders += ', X-My-Quota-Remaining'; // Thêm quota vào danh sách
    } else {
      // 4b. Nếu KHÔNG TÌM THẤY quota
      newHeaders.append('X-Debug-Quota', 'Khong_Tim_Thay_Quota_Tu_Photoroom');
    }

    // 5. Luôn cho phép trình duyệt đọc các header debug
    newHeaders.append('Access-Control-Expose-Headers', exposedHeaders);

    // 6. Trả về
    return new Response(response.body, {
      status: 200,
      headers: newHeaders,
    });
    // === HẾT PHẦN CHẨN ĐOÁN ===

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ detail: 'Có lỗi không xác định xảy ra trên server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}