import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'portal_ujian_secret_key_123';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid atau kedaluwarsa' });
    req.user = user;
    next();
  });
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak memiliki izin.' });
    }
    next();
  };
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin' || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }
  next();
};

export const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'siswa') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya siswa yang diizinkan.' });
  }
  next();
};
