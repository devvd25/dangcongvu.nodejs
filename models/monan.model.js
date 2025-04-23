var mongoose = require('mongoose');

var monan = new mongoose.Schema({
  tenMon: { type: String, required: true },
  gia: { type: Number, required: true },
  moTa: { type: String },
  image: { type: String } // Lưu đường dẫn hình ảnh
});

module.exports = mongoose.model('monans', monan);