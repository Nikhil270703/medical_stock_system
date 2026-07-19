const jwt = require('jsonwebtoken');

// A fallback secret key for JWT in development/standalone MERN
const JWT_SECRET = process.env.JWT_SECRET || 'mern_sis_fallback_secret_key_123';

exports.verifyToken = function(req, res, next) {
  let token = null;
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.isMernAuthenticated = true;

      // Populate req.ctx so downstream checks like requirePermission work
      req.ctx = {
        tenantId: 'default',
        tenantCode: 'DEV',
        tenantDb: null,
        userId: decoded.id,
        role: decoded.role,
        permissions: decoded.role === 'admin' 
          ? [
              'result_analysis.view',
              'result_analysis.create',
              'result_analysis.update',
              'result_analysis.delete',
              'result_analysis.admin'
            ]
          : [
              'result_analysis.view',
              'result_analysis.create',
              'result_analysis.update'
            ],
        requestId: 'mern-' + Date.now(),
      };
      
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired auth token' });
    }
  }

  // Fallback to gateway headers if they exist (allows standalone + host gateway mode)
  const internalToken = req.header('X-Internal-Token');
  const tenantId = req.header('X-Tenant-Id');
  if (internalToken || tenantId) {
    // Let gateway verifyInternal & context run
    return next();
  }

  // If no auth headers whatsoever, return 401
  return res.status(401).json({ error: 'Authentication required' });
};
