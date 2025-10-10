// File: /api/photoroom.js

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Chỉ cho phép phương thức POST
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Lấy dữ liệu form gửi lên, trong đó có file ảnh
    const formData = await request.formData();
    const imageFile = formData.get('image_file');

    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'Không tìm thấy file ảnh.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Đọc API key từ biến môi trường an toàn trên Vercel
    const apiKey = process.env.PHOTOROOM_API_KEY;

    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key chưa được cấu hình trên server.' }), {
          status: 500,
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
      return new Response(JSON.stringify({ error: `Lỗi từ Photoroom: ${errorText}` }), {
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
    console.error(error);
    return new Response(JSON.stringify({ error: 'Có lỗi xảy ra trên server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}