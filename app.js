require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var multer = require('multer');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var http = require('http');
var { Server } = require('socket.io');
var port = 5555; //localhost mặc định

var indexRouter = require('./routes/index');
var User = require('./models/user.model');

// Cấu hình multer
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
var upload = multer({ storage: storage });

var app = express();
var server = http.createServer(app);
var io = new Server(server);

// Lưu trữ socket của các user theo userId
const userSockets = {};

// Xử lý kết nối WebSocket
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register', (userId) => {
    userSockets[userId] = socket.id;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (let userId in userSockets) {
      if (userSockets[userId] === socket.id) {
        delete userSockets[userId];
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

app.set('io', io);
app.set('userSockets', userSockets);

// Kết nối MongoDB
mongoose.connect(process.env.DB_URL).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.log('Error connecting to MongoDB:', err);
});

// Cấu hình session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Cấu hình Kiểm tra tài khoản + mật khẩu đúng hay không ?
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Truyền upload vào router để sử dụng trong các route
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Route đăng nhập cho admin và khách hàng
app.get('/login', (req, res) => {
  res.render('login', { message: req.session.messages });
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login',
  failureMessage: true
}), (req, res) => {
  if (req.user.role === 'admin') {
    res.redirect('/');
  } else {
    res.redirect('/menu');
  }
});

// Route đăng ký cho khách hàng
app.get('/register', (req, res) => {
  res.render('register', { message: null });
});

app.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    // Kiểm tra mật khẩu nhập hai lần
    if (password !== confirmPassword) {
      return res.render('register', { message: 'Mật khẩu xác nhận không khớp!' });
    }

    // Kiểm tra yêu cầu phức tạp cho mật khẩu
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.render('register', { 
        message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số!' 
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('register', { message: 'Tên đăng nhập đã tồn tại!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      role: 'customer'
    });

    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    res.render('register', { message: 'Lỗi khi tạo tài khoản. Vui lòng thử lại!' });
  }
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

app.use('/', indexRouter);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

server.listen(port, () => {
  console.log(`Server listening connect port${port}`);
});

module.exports = app;