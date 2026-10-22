const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/fcm-token', verifyToken, authController.updateFCMToken);
router.get('/users', verifyToken, authController.getUsers);
router.post('/employees', verifyToken, requireAdmin, authController.createEmployee);
router.put('/employees/:userId', verifyToken, requireAdmin, authController.updateEmployee);
router.delete('/employees/:userId', verifyToken, requireAdmin, authController.deleteEmployee);

module.exports = router;
