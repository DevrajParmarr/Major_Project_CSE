const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  vehicleName: String,
  stops: [{
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
    },
    locationName: String,
    latitude: Number,
    longitude: Number,
    demand: Number,
    order: Number
  }],
  distance: Number,
  duration: Number,
  totalCapacity: Number
});

const AlgorithmResultSchema = new mongoose.Schema({
  algorithm: {
    type: String,
    required: true
  },
  routes: [RouteSchema],
  totalDistance: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number,
    default: 0
  },
  executionTime: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const OptimizationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  vehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  }],
  locations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  }],
  algorithmResults: [AlgorithmResultSchema],
  // Keep legacy fields for backward compatibility
  routes: [RouteSchema],
  totalDistance: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Optimization', OptimizationSchema);