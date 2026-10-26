const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, taskController.getTasks);
router.post('/', verifyToken, requireAdmin, taskController.createTask);
router.put('/:taskId/complete', verifyToken, taskController.completeTask);
router.put('/:taskId/snooze', verifyToken, taskController.snoozeTask);
router.put('/:taskId/start-date', verifyToken, taskController.updateTaskStartDate);

// Quick notification action routes (no auth required for instant notification clicks)
router.post('/:taskId/quick-snooze', taskController.quickSnoozeTask);
router.put('/:taskId/quick-snooze', taskController.quickSnoozeTask);
router.post('/:taskId/quick-complete', taskController.quickCompleteTask);
router.put('/:taskId/quick-complete', taskController.quickCompleteTask);

router.post('/:taskId/alert', verifyToken, requireAdmin, taskController.sendQuickAlert);
router.delete('/:taskId', verifyToken, requireAdmin, taskController.deleteTask);

module.exports = router;
