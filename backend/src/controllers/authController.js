const User = require('../models/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mern_sis_fallback_secret_key_123';

exports.register = async (req, res) => {
  try {
    const { email, password, role, name, mobile } = req.body;
    
    // Validation
    if (!email || !password || !role || !name || !mobile) {
      return res.status(400).json({ error: 'All fields (email, password, role, name, mobile) are required' });
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new User({ email, password, role, name, mobile });
    await user.save();

    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if status is Active
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Your account is deactivated' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name, mobile: user.mobile },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        mobile: user.mobile
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const userId = req.ctx ? req.ctx.userId : (req.user ? req.user.id : null);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        mobile: user.mobile
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

// ==================== CUSTOMER PORTAL AUTH ====================
const Customer = require('../models/customer');

exports.loginCustomer = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ error: 'Mobile and password are required' });
    }

    // Include password explicitly if it's select: false
    const customer = await Customer.findOne({ mobile }).select('+password');
    if (!customer) {
      return res.status(401).json({ error: 'Invalid mobile or password' });
    }

    if (!customer.password) {
      return res.status(401).json({ error: 'Account not set up for web access. Contact admin.' });
    }

    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid mobile or password' });
    }

    const token = jwt.sign(
      { id: customer._id, mobile: customer.mobile, role: customer.role, name: customer.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: customer._id,
        mobile: customer.mobile,
        role: customer.role,
        name: customer.name
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
