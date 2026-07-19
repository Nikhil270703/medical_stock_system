const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0.01
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'UPI', 'bank transfer', 'cheque'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  referenceNumber: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
