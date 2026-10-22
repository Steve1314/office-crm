const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'office_crm_jwt_super_secret_key_2026', {
    expiresIn: '30d'
  });
};

// Seed or Ensure Admin User exists
const ensureAdminUser = async () => {
  try {
    const adminEmail = 'hans@task.com';
    const existing = await User.findOne({ email: adminEmail });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    if (!existing) {
      await User.create({
        name: 'Hans',
        email: adminEmail,
        password: hashedPassword,
        role: 'Admin',
        status: 'Active'
      });
      console.log('✅ Admin user created: hans@task.com');
    }
  } catch (err) {
    console.warn('Admin check:', err.message);
  }
};
ensureAdminUser();

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    // Handle Admin credentials specifically
    if (cleanEmail === 'hans@task.com') {
      if (password !== '123456') {
        return res.status(401).json({ success: false, message: 'Invalid password for hans@task.com' });
      }
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        user = await User.create({
          name: 'Hans',
          email: cleanEmail,
          password: hashedPassword,
          role: 'Admin',
          status: 'Active'
        });
      }
    } else {
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Account not found. Only Admin-registered employees can log in.' 
        });
      }

      if (user.status === 'Inactive') {
        return res.status(403).json({ 
          success: false, 
          message: 'Your account has been deactivated. Please contact your Admin.' 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Device FCM Token (CRUCIAL for Killed-App Notifications)
exports.updateFCMToken = async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'FCM Token is required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true }
    );

    console.log(`📱 Updated FCM token for user ${user?.name || userId}`);
    res.json({ success: true, message: 'FCM Token updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get list of all employees / team members
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ name: 1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create / Register Employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, role = 'Employee' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'Employee@123', salt);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      status: 'Active'
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Employee
exports.updateEmployee = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, password, status } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    let user = null;
    try {
      user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    } catch (e) {
      user = await User.findOneAndUpdate({ email: userId }, updateData, { new: true }).select('-password');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Employee updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { userId } = req.params;
    let user = null;
    try {
      user = await User.findByIdAndDelete(userId);
    } catch (e) {
      user = await User.findOneAndDelete({ $or: [{ _id: userId }, { email: userId }] });
    }

    res.json({ success: true, message: 'Employee deleted successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
