const mongoose = require('mongoose');
const Expo = require('./models/Expo.model');

mongoose.connect('mongodb://localhost:27017/emseproject').then(async () => {
  const expo = await Expo.findOne().sort({ createdAt: -1 });
  console.log('Latest Expo banner URL:', expo?.bannerImage);
  process.exit(0);
});
