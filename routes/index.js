var express = require('express');
var router = express.Router();
var MonAn = require('../models/monan.model');
var Order = require('../models/order.model');
var Settings = require('../models/settings.model');
var User = require('../models/user.model');
var sampleDishes = require('../data/sampleDishes');
const sharp = require('sharp');
const path = require('path');
var Music = require('../models/music.model'); // Thêm model Music

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

/* GET Trang Chủ Quản Trị ---- req.query.search Dùng tìm kiếm, view trong menu.pug ( // Tìm kiếm món ăn ) */ 
router.get('/', ensureAuthenticated, async function(req, res, next) {
  try {
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    let monansQuery = MonAn.find();
    if (searchQuery) {
      monansQuery = monansQuery.where('tenMon').regex(new RegExp(searchQuery, 'i'));
    }

    const totalMonans = await MonAn.countDocuments(monansQuery.getQuery());
    const monans = await monansQuery.skip(skip).limit(limit).exec();
    const totalPages = Math.ceil(totalMonans / limit);

    const musics = await Music.find().sort({ createdAt: 1 }); // Lấy danh sách nhạc
    const logo = await Settings.findOne({ key: 'logo' });
    const banner = await Settings.findOne({ key: 'banner' });
    res.render('index', { 
      monans: monans,
      musics: musics, // Truyền danh sách nhạc vào giao diện
      logo: logo ? logo.value : '/images/logo.png',
      banner: banner ? banner.value : '/images/banner.png',
      searchQuery: searchQuery,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (err) {
    console.log('Error:', err);
    res.render('index', { 
      monans: [],
      musics: [],
      logo: '/images/logo.png',
      banner: '/images/banner.png',
      searchQuery: '',
      currentPage: 1,
      totalPages: 1,
      error: 'Lỗi khi tải trang. Vui lòng thử lại.'
    });
  }
});

/* GET music list for frontend */
router.get('/music', async (req, res) => {
  try {
    const musics = await Music.find().sort({ createdAt: 1 });
    res.json(musics);
  } catch (err) {
    console.error('Error fetching music:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách nhạc.' });
  }
});

/* POST add music */
router.post('/add-music', ensureAuthenticated, async (req, res) => {
  try {
    const { title, url } = req.body;
    if (!title || !url) {
      return res.redirect('/?error=' + encodeURIComponent('Vui lòng nhập đầy đủ thông tin nhạc!'));
    }
    const newMusic = new Music({ title, url });
    await newMusic.save();
    res.redirect('/?success=' + encodeURIComponent('Thêm nhạc thành công!'));
  } catch (err) {
    console.error('Error adding music:', err);
    res.redirect('/?error=' + encodeURIComponent('Lỗi khi thêm nhạc. Vui lòng thử lại.'));
  }
});

/* POST update music */
router.post('/update-music/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { title, url } = req.body;
    if (!title || !url) {
      return res.redirect('/?error=' + encodeURIComponent('Vui lòng nhập đầy đủ thông tin nhạc!'));
    }
    await Music.findByIdAndUpdate(req.params.id, { title, url });
    res.redirect('/?success=' + encodeURIComponent('Cập nhật nhạc thành công!'));
  } catch (err) {
    console.error('Error updating music:', err);
    res.redirect('/?error=' + encodeURIComponent('Lỗi khi cập nhật nhạc. Vui lòng thử lại.'));
  }
});

/* GET delete music */
router.get('/delete-music/:id', ensureAuthenticated, async (req, res) => {
  try {
    await Music.findByIdAndDelete(req.params.id);
    res.redirect('/?success=' + encodeURIComponent('Xóa nhạc thành công!'));
  } catch (err) {
    console.error('Error deleting music:', err);
    res.redirect('/?error=' + encodeURIComponent('Lỗi khi xóa nhạc. Vui lòng thử lại.'));
  }
});

/* POST Tạo Món Ăn */
router.post('/', ensureAuthenticated, (req, res, next) => req.upload.single('image')(req, res, next), async function(req, res, next) {
  try {
    const newMonAn = new MonAn({
      tenMon: req.body.tenMon,
      gia: req.body.gia,
      moTa: req.body.moTa,
      image: req.file ? '/uploads/' + req.file.filename : req.body.image
    });
    await newMonAn.save();
    res.redirect('/');
  } catch (err) {
    console.log('Error:', err);
    const logo = await Settings.findOne({ key: 'logo' });
    const banner = await Settings.findOne({ key: 'banner' });
    res.render('index', { 
      monans: await MonAn.find(),
      logo: logo ? logo.value : '/images/logo.png',
      banner: banner ? banner.value : '/images/banner.png',
      searchQuery: '',
      error: 'Lỗi khi thêm món ăn. Vui lòng thử lại.'
    });
  }
});

/* POST Cập Nhập Món Ăn */
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
    const logo = await Settings.findOne({ key: 'logo' });
    const banner = await Settings.findOne({ key: 'banner' });
    res.render('index', { 
      monans: await MonAn.find(),
      logo: logo ? logo.value : '/images/logo.png',
      banner: banner ? banner.value : '/images/banner.png',
      searchQuery: '',
      error: 'Lỗi khi cập nhật món ăn. Vui lòng thử lại.'
    });
  }
});

/* POST xóa món ăn */
router.post('/delete', ensureAuthenticated, async (req, res) => {
  try {
    let id = req.body.id;
    await MonAn.findByIdAndDelete(id);
    res.redirect('/');
  } catch (err) {
    console.log('Error:', err);
    const logo = await Settings.findOne({ key: 'logo' });
    const banner = await Settings.findOne({ key: 'banner' });
    res.render('index', { 
      monans: await MonAn.find(),
      logo: logo ? logo.value : '/images/logo.png',
      banner: banner ? banner.value : '/images/banner.png',
      searchQuery: '',
      error: 'Lỗi khi xóa món ăn. Vui lòng thử lại.'
    });
  }
});

/* GET trang menu cho khách hàng */
router.get('/menu', ensureCustomerAuthenticated, async (req, res, next) => {
  try {
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Số món ăn mỗi trang
    const skip = (page - 1) * limit;

    let monansQuery = MonAn.find();
    if (searchQuery) {
      monansQuery = monansQuery.where('tenMon').regex(new RegExp(searchQuery, 'i'));
    }

    const totalMonans = await MonAn.countDocuments(monansQuery.getQuery());
    const monans = await monansQuery.skip(skip).limit(limit).exec();
    const totalPages = Math.ceil(totalMonans / limit);

    const orders = await Order.find({ userId: req.user._id }).populate('monanId');
    const logo = await Settings.findOne({ key: 'logo' });
    const banner = await Settings.findOne({ key: 'banner' });
    res.render('menu', { 
      monans: monans, 
      orders: orders, 
      user: req.user, 
      searchQuery: searchQuery,
      currentPage: page,
      totalPages: totalPages,
      logo: logo ? logo.value : '/images/logo.png',
      banner: banner ? banner.value : '/images/banner.png'
    });
  } catch (err) {
    console.log('Error:', err);
    res.render('menu', { 
      monans: [],
      orders: [],
      user: req.user,
      searchQuery: '',
      currentPage: 1,
      totalPages: 1,
      logo: '/images/logo.png',
      banner: '/images/banner.png',
      error: 'Lỗi khi tải trang. Vui lòng thử lại.'
    });
  }
});

/* GET form đặt hàng */
router.get('/order-form/:monanId', ensureCustomerAuthenticated, async (req, res) => {
  try {
    const monan = await MonAn.findById(req.params.monanId);
    if (!monan) {
      return res.status(404).send('Món ăn không tồn tại');
    }
    res.render('order-form', { monan: monan });
  } catch (err) {
    console.log('Error:', err);
    res.status(500).send('Lỗi khi tải form đặt món. Vui lòng thử lại.');
  }
});

/* POST gọi món */
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
    res.render('menu', { 
      monans: await MonAn.find(),
      orders: await Order.find({ userId: req.user._id }).populate('monanId'),
      user: req.user,
      searchQuery: '',
      logo: '/images/logo.png',
      banner: '/images/banner.png',
      error: 'Lỗi khi đặt món. Vui lòng thử lại.'
    });
  }
});

/* GET trang quản lý đơn hàng cho admin */
router.get('/orders', ensureAuthenticated, async (req, res) => {
  try {
    const statusFilter = req.query.status || 'all';
    let query = {};
    if (statusFilter !== 'all') {
      query.status = statusFilter;
    }
    const orders = await Order.find(query).populate('userId').populate('monanId');
    const logo = await Settings.findOne({ key: 'logo' });
    const banner = await Settings.findOne({ key: 'banner' });
    res.render('orders', { 
      orders: orders, 
      statusFilter: statusFilter,
      logo: logo ? logo.value : '/images/logo.png',
      banner: banner ? banner.value : '/images/banner.png'
    });
  } catch (err) {
    console.log('Error:', err);
    res.render('orders', { 
      orders: [], 
      statusFilter: 'all', 
      logo: '/images/logo.png',
      banner: '/images/banner.png',
      error: 'Lỗi khi tải danh sách đơn hàng.' 
    });
  }
});

/* POST cập nhật trạng thái đơn hàng */
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
    res.render('orders', { 
      orders: await Order.find().populate('userId').populate('monanId'), 
      statusFilter: 'all', 
      error: 'Lỗi khi cập nhật trạng thái đơn hàng.' 
    });
  }
});

/* POST xóa đơn hàng */
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
    res.render('orders', { 
      orders: await Order.find().populate('userId').populate('monanId'), 
      statusFilter: 'all', 
      error: 'Lỗi khi xóa đơn hàng.' 
    });
  }
});

/* GET tìm kiếm món ăn */
router.get('/search-dish', ensureAuthenticated, async (req, res) => {
  try {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    if (!query) {
      return res.json([]);
    }

    const results = sampleDishes.filter(dish => 
      dish.tenMon.toLowerCase().includes(query)
    );
    res.json(results);
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ error: 'Lỗi khi tìm kiếm món ăn.' });
  }
});

/* GET trang cài đặt cho quản trị viên */
router.get('/settings', ensureAuthenticated, async (req, res) => {
  try {
    const logo = await Settings.findOne({ key: 'logo' });
    const banner = await Settings.findOne({ key: 'banner' });
    res.render('settings', { 
      logo: logo ? logo.value : '/images/logo.png',
      banner: banner ? banner.value : '/images/banner.png'
    });
  } catch (err) {
    console.log('Error:', err);
    res.render('settings', { 
      logo: '/images/logo.png',
      banner: '/images/banner.png',
      error: 'Lỗi khi tải trang cài đặt.'
    });
  }
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
    res.render('settings', { 
      logo: '/images/logo.png',
      banner: '/images/banner.png',
      error: 'Lỗi khi cập nhật logo.'
    });
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
    res.render('settings', { 
      logo: '/images/logo.png',
      banner: '/images/banner.png',
      error: 'Lỗi khi cập nhật banner.'
    });
  }
});

/* GET trang quản lý người dùng cho admin */
router.get('/users', ensureAuthenticated, async (req, res) => {
  try {
    const users = await User.find();
    const logo = await Settings.findOne({ key: 'logo' });
    const banner = await Settings.findOne({ key: 'banner' });
    res.render('users', { 
      users: users,
      logo: logo ? logo.value : '/images/logo.png',
      banner: banner ? banner.value : '/images/banner.png'
    });
  } catch (err) {
    console.log('Error:', err);
    res.render('users', { 
      users: [],
      logo: '/images/logo.png',
      banner: '/images/banner.png',
      error: 'Lỗi khi tải danh sách người dùng.'
    });
  }
});

/* POST Xóa user */
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