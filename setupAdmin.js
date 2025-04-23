const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user.model');

mongoose.connect('mongodb://localhost/CRUD_monan', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  const username = 'admin';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = new User({
    username: username,
    password: hashedPassword,
    role: 'admin'
  });

  await admin.save();
  console.log('Admin user created:', admin);
  mongoose.disconnect();
}).catch(err => {
  console.log('Error:', err);
});