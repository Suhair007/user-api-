const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { isValidMobile, isValidPAN } = require('../utils/validations');

// 1. Create User
exports.createUser = (req, res) => {
  const { full_name, mob_num, pan_num, manager_id } = req.body;

  if (!full_name || full_name.trim() === '') {
    return res.status(400).json({ error: 'Full name is required' });
  }

  const cleanedMob = isValidMobile(mob_num);
  if (!cleanedMob) {
    return res.status(400).json({ error: 'Invalid mobile number' });
  }

  if (!isValidPAN(pan_num)) {
    return res.status(400).json({ error: 'Invalid PAN number' });
  }

  db.get('SELECT * FROM managers WHERE manager_id = ? AND is_active = 1', [manager_id], (err, manager) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!manager) return res.status(400).json({ error: 'Manager not found or inactive' });

    const user_id = uuidv4();
    const now = new Date().toISOString();

    db.run(`
      INSERT INTO users (user_id, full_name, mob_num, pan_num, manager_id, created_at, updated_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [user_id, full_name, cleanedMob, pan_num.toUpperCase(), manager_id, now, now], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ message: 'User created successfully', user_id });
    });
  });
};

// 2. Get Users
exports.getUsers = (req, res) => {
  const { user_id, mob_num, manager_id } = req.body || {};

  let query = 'SELECT * FROM users WHERE is_active = 1';
  const params = [];

  if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }

  if (mob_num) {
    const cleanedMob = isValidMobile(mob_num);
    if (!cleanedMob) return res.status(400).json({ error: 'Invalid mobile number' });
    query += ' AND mob_num = ?';
    params.push(cleanedMob);
  }

  if (manager_id) {
    query += ' AND manager_id = ?';
    params.push(manager_id);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ users: rows || [] });
  });
};

// 3. Delete User
exports.deleteUser = (req, res) => {
  const { user_id, mob_num } = req.body;

  if (!user_id && !mob_num) {
    return res.status(400).json({ error: 'Provide either user_id or mob_num' });
  }

  let query = 'UPDATE users SET is_active = 0 WHERE is_active = 1';
  const params = [];

  if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }

  if (mob_num) {
    const cleanedMob = isValidMobile(mob_num);
    if (!cleanedMob) return res.status(400).json({ error: 'Invalid mobile number' });
    query += ' AND mob_num = ?';
    params.push(cleanedMob);
  }

  db.run(query, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'User deleted successfully (marked as inactive)' });
  });
};

// 4. Update User
exports.updateUser = (req, res) => {
  const { user_ids, update_data } = req.body;
  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({ error: 'Invalid or missing user_ids' });
  }

  const { full_name, mob_num, pan_num, manager_id } = update_data;

  // If only manager_id update, do bulk operation
  if (manager_id && !full_name && !mob_num && !pan_num) {
    db.get('SELECT * FROM managers WHERE manager_id = ? AND is_active = 1', [manager_id], (err, manager) => {
      if (err || !manager) return res.status(400).json({ error: 'Invalid or inactive manager_id' });

      const now = new Date().toISOString();
      let completed = 0;

      user_ids.forEach((id) => {
        db.get('SELECT * FROM users WHERE user_id = ? AND is_active = 1', [id], (err, user) => {
          if (user) {
            db.run('UPDATE users SET is_active = 0 WHERE user_id = ?', [id]);
            const newId = uuidv4();
            db.run(`
              INSERT INTO users (user_id, full_name, mob_num, pan_num, manager_id, created_at, updated_at, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `, [newId, user.full_name, user.mob_num, user.pan_num, manager_id, user.created_at, now], () => {
              completed++;
              if (completed === user_ids.length) {
                return res.json({ message: 'Manager updated for selected users' });
              }
            });
          } else {
            completed++;
            if (completed === user_ids.length) {
              return res.json({ message: 'Some users not found, others updated' });
            }
          }
        });
      });
    });
  } else {
    // Individual update with validations
    if (!full_name || !mob_num || !pan_num || !manager_id) {
      return res.status(400).json({ error: 'Missing fields for update' });
    }

    const cleanedMob = isValidMobile(mob_num);
    if (!cleanedMob) return res.status(400).json({ error: 'Invalid mobile number' });
    if (!isValidPAN(pan_num)) return res.status(400).json({ error: 'Invalid PAN number' });

    db.get('SELECT * FROM managers WHERE manager_id = ? AND is_active = 1', [manager_id], (err, manager) => {
      if (err || !manager) return res.status(400).json({ error: 'Invalid or inactive manager_id' });

      const now = new Date().toISOString();
      let completed = 0;

      user_ids.forEach((id) => {
        db.get('SELECT * FROM users WHERE user_id = ? AND is_active = 1', [id], (err, user) => {
          if (user) {
            db.run('UPDATE users SET is_active = 0 WHERE user_id = ?', [id]);
            const newId = uuidv4();
            db.run(`
              INSERT INTO users (user_id, full_name, mob_num, pan_num, manager_id, created_at, updated_at, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `, [newId, full_name, cleanedMob, pan_num.toUpperCase(), manager_id, user.created_at, now], () => {
              completed++;
              if (completed === user_ids.length) {
                return res.json({ message: 'User(s) updated successfully' });
              }
            });
          } else {
            completed++;
            if (completed === user_ids.length) {
              return res.json({ message: 'Some users not found, others updated' });
            }
          }
        });
      });
    });
  }
};
