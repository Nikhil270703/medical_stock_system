const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor', // Reuses Vendor model
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Ordered', 'Received', 'Cancelled'],
    default: 'Ordered'
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
