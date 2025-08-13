const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optimizationController = require('../controllers/optimization');

// @route   GET api/optimization
// @desc    Get all optimizations
// @access  Private
router.get('/', auth, optimizationController.getOptimizations);

// @route   GET api/optimization/:id
// @desc    Get optimization by ID
// @access  Private
router.get('/:id', auth, optimizationController.getOptimizationById);

// @route   POST api/optimization
// @desc    Create optimization
// @access  Private
router.post('/', auth, optimizationController.createOptimization);

// @route   DELETE api/optimization/:id
// @desc    Delete optimization
// @access  Private
router.delete('/:id', auth, optimizationController.deleteOptimization);

// New: get road-routed polyline for a route index
router.get('/:id/route/:routeIndex/polyline', auth, optimizationController.getRoutedPolyline);

module.exports = router;