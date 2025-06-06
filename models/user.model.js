var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' } // Thêm vai trò
});

module.exports = mongoose.model('users', userSchema);