const Razorpay = require('razorpay');
const Bill = require('../models/bill');
const Order = require('../models/order');
const Payment = require('../models/payment');
const crypto = require('crypto');

// Safe fallback for Razorpay
let razorpayInstance = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
} catch (e) {
  console.log("Razorpay initialization skipped: Missing API keys");
}

exports.createPaymentLink = async (req, res) => {
  try {
    const { billId } = req.body;
    const bill = await Bill.findById(billId).populate('customer');
    if (!bill) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    if (bill.status === 'Paid') {
      return res.status(400).json({ message: 'Invoice is already paid' });
    }

    const amountInPaise = Math.round(bill.totalAmount * 100);

    if (razorpayInstance) {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${bill._id}`,
        payment_capture: 1, // Auto capture
        notes: {
          billId: bill._id.toString()
        }
      };

      const order = await razorpayInstance.orders.create(options);
      
      bill.paymentOrderId = order.id;
      bill.paymentStatus = 'Pending';
      await bill.save();

      return res.status(200).json({ 
        orderId: order.id, 
        amount: options.amount, 
        currency: options.currency, 
        keyId: process.env.RAZORPAY_KEY_ID 
      });
    } else {
      // Sandbox / Demo Mode
      console.log(`[Sandbox] Generating Mock Payment Link for Bill ${billId} of amount ${bill.totalAmount}`);
      bill.paymentOrderId = `mock_order_${Date.now()}`;
      bill.paymentStatus = 'Pending';
      await bill.save();

      return res.status(200).json({
        orderId: bill.paymentOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: 'mock_key',
        isSandbox: true
      });
    }

  } catch (error) {
    console.error('Create Payment Link Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId, isSandbox } = req.body;

    let isValid = false;

    if (isSandbox) {
      // Sandbox mode mock verification
      console.log(`[Sandbox] Verifying mock payment for ${razorpay_order_id}`);
      isValid = true;
    } else if (process.env.RAZORPAY_KEY_SECRET) {
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      isValid = (generated_signature === razorpay_signature);
    }

    if (isValid) {
      const bill = await Bill.findById(billId);
      if (bill) {
        bill.paymentStatus = 'Paid';
        bill.status = 'Paid';
        await bill.save();

        // Create a Payment record automatically
        const payment = new Payment({
          amount: bill.totalAmount,
          date: new Date(),
          customer: bill.customer,
          paymentMode: 'Online',
          referenceNumber: razorpay_payment_id || `sandbox_${Date.now()}`,
          notes: 'Auto-recorded via Payment Gateway',
          bill: bill._id
        });
        await payment.save();
        
        // WhatsApp Webhook call could go here...
        const { sendWhatsAppPaymentReceipt } = require('../services/notificationService');
        if (sendWhatsAppPaymentReceipt) {
          sendWhatsAppPaymentReceipt(payment._id).catch(err => console.error("WP API error", err));
        }

        return res.status(200).json({ message: 'Payment verified successfully', payment });
      } else {
         return res.status(404).json({ message: 'Bill not found' });
      }
    } else {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
