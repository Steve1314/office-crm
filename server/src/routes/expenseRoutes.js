const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, expenseController.getExpenses);
router.post('/', verifyToken, expenseController.createExpense);
router.post('/issue-money', verifyToken, requireAdmin, expenseController.issueMoney);
router.get('/transactions', verifyToken, expenseController.getTransactions);
router.delete('/:expenseId', verifyToken, requireAdmin, expenseController.deleteExpense);
router.post('/settlements', verifyToken, requireAdmin, expenseController.createSettlement);
router.get('/settlements', verifyToken, expenseController.getSettlements);

module.exports = router;
