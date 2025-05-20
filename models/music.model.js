const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Tiêu đề bài nhạc
  url: { type: String, required: true }, // URL của file nhạc (có thể là đường dẫn cục bộ hoặc URL bên ngoài)
  createdAt: { type: Date, default: Date.now } // Thời gian tạo
});

module.exports = mongoose.model('Music', musicSchema);