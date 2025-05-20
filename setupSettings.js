const mongoose = require('mongoose');
const Settings = require('./models/settings.model');

mongoose.connect('mongodb://localhost/CRUD_monan').then(async () => {
  console.log('Connected to MongoDB');

  await Settings.findOneAndUpdate(
    { key: 'logo' },
    { key: 'logo', value: '/images/logo.png' },
    { upsert: true }
  );
  await Settings.findOneAndUpdate(
    { key: 'banner' },
    { key: 'banner', value: '/images/banner.png' },
    { upsert: true }
  );

  console.log('Default logo and banner set');
  mongoose.disconnect();
}).catch(err => {
  console.log('Error:', err);
});