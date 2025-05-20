var mongoose = require('mongoose');

var orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  monanId: { type: mongoose.Schema.Types.ObjectId, ref: 'monans', required: true },
  tenMon: { type: String, required: true },
  gia: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  status: { type: String, enum: ['đang làm', 'đang giao', 'đã giao'], default: 'đang làm' },
  createdAt: { type: Date, default: Date.now },
  statusHistory: [{
    status: { type: String, enum: ['đang làm', 'đang giao', 'đã giao'] },
    timestamp: { type: Date, default: Date.now }
  }]
});

// Khi tạo đơn hàng, tự động thêm trạng thái ban đầu vào lịch sử
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory = [{ status: this.status, timestamp: this.createdAt }];
  }
  next();
});

module.exports = mongoose.model('orders', orderSchema);