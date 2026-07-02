const cloudinary = require("cloudinary").v2;
require('dotenv').config({ path: './.env' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function test() {
  try {
    const result = await cloudinary.uploader.upload("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", {
      folder: 'eventsphere/test'
    });
    console.log("Cloudinary Upload Success:", result.secure_url);
  } catch(err) {
    console.error("Cloudinary Error:", err);
  }
}
test();
