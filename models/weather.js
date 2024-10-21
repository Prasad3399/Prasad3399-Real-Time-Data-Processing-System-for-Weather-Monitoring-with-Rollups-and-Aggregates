const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  city: String,
  temperature: Number,
  humidity: Number,
  wind: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Weather', weatherSchema);
