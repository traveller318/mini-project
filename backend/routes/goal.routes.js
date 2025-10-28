const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goal.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Get goals
router.get('/', goalController.getAllGoals);
router.get('/:id', goalController.getGoal);

// Create, update, delete
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

// Contribute to goal
router.post('/:id/contribute', goalController.contributeToGoal);

// Set main goal
router.put('/:id/set-main', goalController.setMainGoal);

module.exports = router;
