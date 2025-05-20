var mongoose = require('mongoose');

var settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // 'logo' hoặc 'banner'
  value: { type: String, required: true } // Đường dẫn file
});

module.exports = mongoose.model('settings', settingsSchema);