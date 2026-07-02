const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    // login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'organizer@eventsphere.com',
      password: 'Password123!'
    });
    const cookie = loginRes.headers['set-cookie'][0];

    // Create a dummy image
    fs.writeFileSync('dummy.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));

    const fd = new FormData();
    fd.append('name', 'Test Expo Image Upload');
    fd.append('description', 'This is a test to verify Cloudinary is working');
    fd.append('startDate', new Date().toISOString());
    fd.append('endDate', new Date(Date.now() + 86400000).toISOString());
    fd.append('banner', fs.createReadStream('dummy.png'));

    const res = await axios.post('http://localhost:5000/api/expos', fd, {
      headers: {
        ...fd.getHeaders(),
        Cookie: cookie
      }
    });

    console.log('Success! Banner URL:', res.data.data.expo.bannerImage);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}
test();
