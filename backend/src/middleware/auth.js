const jwt = require('jsonwebtoken');
const { usersMap } = require('../config/dataStore');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      let user = null;
      for (const u of usersMap.values()) {
        if (u._id === decoded.id) {
          user = u;
          break;
        }
      }

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = {
        _id: user._id,
        email: user.email,
        name: user.name,
        preferredLanguage: user.preferredLanguage
      };

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
