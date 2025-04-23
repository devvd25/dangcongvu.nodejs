var express = require('express');
var router = express.Router();
var MonAn = require('../models/monan.model');
var Order = require('../models/order.model');
var Settings = require('../models/settings.model');
var User = require('../models/user.model');
var sampleDishes = require('../data/sampleDishes');
const sharp = require('sharp');
const path = require('path');

// Middleware kiểm tra đăng nhập
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.role === 'admin') {
      return next();
    } else {
      res.redirect('/menu');
    }
  }
  res.redirect('/login');
}

// Middleware kiểm tra đăng nhập cho khách hàng
function ensureCustomerAuthenticated(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'customer') {
    return next();
  }
  res.redirect('/login');
}

/* GET admin home page */
router.get('/', ensureAuthenticated, async function(req, res, next) {
  const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';
  let monansQuery = MonAn.find();

  if (searchQuery) {
    monansQuery = monansQuery.where('tenMon').regex(new RegExp(searchQuery, 'i'));
  }

  const monans = await monansQuery.exec();
  const logo = await Settings.findOne({ key: 'logo' });
  const banner = await Settings.findOne({ key: 'banner' });
  res.render('index', { 
    monans: monans,
    logo: logo ? logo.value : '/images/logo.png',
    banner: banner ? banner.value : '/images/banner.png',
    searchQuery: searchQuery
  });
});

/* POST create dish */
router.post('/', ensureAuthenticated, (req, res, next) => req.upload.single('image')(req, res, next), async function(req, res, next) {
  try {
    var newMonAn = new MonAn({
      tenMon: req.body.tenMon,
      gia: req.body.gia,
      moTa: req.body.moTa,
      image: req.file ? '/uploads/' + req.file.filename : req.body.image
    });
    await newMonAn.save();
    res.redirect('/');
  } catch (err) {
    console.log('Error:', err);
  }
});

/* POST update dish */
router.post('/update', ensureAuthenticated, (req, res, next) => req.upload.single('image')(req, res, next), async (req, res) => {
  try {
    let id = req.body.id;
    let updateData = {
      tenMon: req.body.tenMon,
      gia: req.body.gia,
      moTa: req.body.moTa
    };
    if (req.file) {
      updateData.image = '/uploads/' + req.file.filename;
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }
    await MonAn.findByIdAndUpdate(id, updateData, { new: true });
    res.redirect('/');
  } catch (err) {
    console.log('Error:', err);
  }
});

/* POST delete dish */
router.post('/delete', ensureAuthenticated, async (req, res) => {
  try {
    let id = req.body.id;
    await MonAn.findByIdAndDelete(id);
    res.redirect('/');
  } catch (err) {
    console.log('Error:', err);
  }
});

/* GET menu page for customers */
router.get('/menu', ensureCustomerAuthenticated, async (req, res, next) => {
  const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';
  let monansQuery = MonAn.find();

  if (searchQuery) {
    monansQuery = monansQuery.where('tenMon').regex(new RegExp(searchQuery, 'i'));
  }

  const monans = await monansQuery.exec();
  let orders = await Order.find({ userId: req.user._id }).populate('monanId');
  const logo = await Settings.findOne({ key: 'logo' });
  const banner = await Settings.findOne({ key: 'banner' });
  res.render('menu', { 
    monans: monans, 
    orders: orders, 
    user: req.user, 
    searchQuery: searchQuery,
    logo: logo ? logo.value : '/images/logo.png',
    banner: banner ? banner.value : '/images/banner.png'
  });
});

/* GET order form */
router.get('/order-form/:monanId', ensureCustomerAuthenticated, async (req, res) => {
  const monan = await MonAn.findById(req.params.monanId);
  if (!monan) {
    return res.status(404).send('Món ăn không tồn tại');
  }
  res.render('order-form', { monan: monan });
});

/* POST order dish */
router.post('/order', ensureCustomerAuthenticated, async (req, res) => {
  try {
    const monanId = req.body.monanId;
    const monan = await MonAn.findById(monanId);
    if (!monan) {
      return res.status(404).send('Món ăn không tồn tại');
    }
    const order = new Order({
      userId: req.user._id,
      monanId: monanId,
      tenMon: monan.tenMon,
      gia: monan.gia,
      quantity: req.body.quantity,
      customerName: req.body.customerName,
      phone: req.body.phone,
      address: req.body.address,
      status: 'đang làm'
    });
    await order.save();
    res.redirect('/menu');
  } catch (err) {
    console.log('Error:', err);
    res.redirect('/menu');
  }
});

/* GET orders management page for admin */
router.get('/orders', ensureAuthenticated, async (req, res) => {
  const statusFilter = req.query.status || 'all';
  let query = {};
  if (statusFilter !== 'all') {
    query.status = statusFilter;
  }
  const orders = await Order.find(query).populate('userId').populate('monanId');
  res.render('orders', { orders: orders, statusFilter: statusFilter });
});

/* POST update order status */
router.post('/update-order-status', ensureAuthenticated, async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await Order.findById(orderId).populate('userId');
    if (order) {
      order.status = status;
      order.statusHistory.push({ status: status, timestamp: new Date() });
      await order.save();

      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      const userId = order.userId._id.toString();
      const socketId = userSockets[userId];
      if (socketId) {
        const latestStatus = order.statusHistory[order.statusHistory.length - 1];
        io.to(socketId).emit('orderStatusUpdate', {
          orderId: order._id,
          status: order.status,
          timestamp: latestStatus.timestamp.toLocaleString()
        });
      }
    }
    res.redirect('/orders');
  } catch (err) {
    console.log('Error:', err);
    res.redirect('/orders');
  }
});

/* POST delete order */
router.post('/delete-order', ensureAuthenticated, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('userId');
    if (order) {
      await Order.findByIdAndDelete(orderId);
      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      const userId = order.userId._id.toString();
      const socketId = userSockets[userId];
      if (socketId) {
        io.to(socketId).emit('orderDeleted', { orderId: order._id });
      }
    }
    res.redirect('/orders');
  } catch (err) {
    console.log('Error:', err);
    res.redirect('/orders');
  }
});

/* GET search dish */
router.get('/search-dish', ensureAuthenticated, async (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : '';
  if (!query) {
    return res.json([]);
  }

  const results = sampleDishes.filter(dish => 
    dish.tenMon.toLowerCase().includes(query)
  );
  res.json(results);
});

/* GET settings page for admin */
router.get('/settings', ensureAuthenticated, async (req, res) => {
  const logo = await Settings.findOne({ key: 'logo' });
  const banner = await Settings.findOne({ key: 'banner' });
  res.render('settings', { 
    logo: logo ? logo.value : '/images/logo.png',
    banner: banner ? banner.value : '/images/banner.png'
  });
});

/* POST update logo */
router.post('/update-logo', ensureAuthenticated, (req, res, next) => req.upload.single('logo')(req, res, next), async (req, res) => {
  try {
    if (req.file) {
      const logoPath = '/uploads/' + req.file.filename;
      await Settings.findOneAndUpdate(
        { key: 'logo' },
        { key: 'logo', value: logoPath },
        { upsert: true }
      );
    }
    res.redirect('/settings');
  } catch (err) {
    console.log('Error:', err);
    res.redirect('/settings');
  }
});

/* POST update banner */
router.post('/update-banner', ensureAuthenticated, (req, res, next) => req.upload.single('banner')(req, res, next), async (req, res) => {
  try {
    if (req.file) {
      const bannerPath = '/uploads/' + req.file.filename;
      await sharp(req.file.path)
        .resize(1200, 400, {
          fit: sharp.fit.cover,
          position: sharp.strategy.entropy
        })
        .toFile(req.file.path + '_resized.jpg');
      
      const resizedBannerPath = '/uploads/' + path.basename(req.file.path) + '_resized.jpg';
      await Settings.findOneAndUpdate(
        { key: 'banner' },
        { key: 'banner', value: resizedBannerPath },
        { upsert: true }
      );
    }
    res.redirect('/settings');
  } catch (err) {
    console.log('Error:', err);
    res.redirect('/settings');
  }
});

/* GET users management page for admin */
router.get('/users', ensureAuthenticated, async (req, res) => {
  const users = await User.find();
  const logo = await Settings.findOne({ key: 'logo' });
  const banner = await Settings.findOne({ key: 'banner' });
  res.render('users', { 
    users: users,
    logo: logo ? logo.value : '/images/logo.png',
    banner: banner ? banner.value : '/images/banner.png'
  });
});

/* POST delete user */
router.post('/delete-user', ensureAuthenticated, async (req, res) => {
  try {
    const { userId } = req.body;
    if (userId === req.user._id.toString()) {
      throw new Error('Bạn không thể xóa tài khoản của chính mình!');
    }
    await Order.deleteMany({ userId: userId });
    await User.findByIdAndDelete(userId);
    res.redirect('/users');
  } catch (err) {
    console.log('Error:', err);
    const users = await User.find();
    const logo = await Settings.findOne({ key: 'logo' });
    const banner = await Settings.findOne({ key: 'banner' });
    res.render('users', { 
      users: users,
      logo: logo ? logo.value : '/images/logo.png',
      banner: banner ? banner.value : '/images/banner.png',
      error: err.message
    });
  }
});

module.exports = router;