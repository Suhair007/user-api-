const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');

router.post('/create_user', controller.createUser);
router.get('/get_users', controller.getUsers);
router.delete('/delete_user', controller.deleteUser);
router.patch('/update_user', controller.updateUser);

module.exports = router;
