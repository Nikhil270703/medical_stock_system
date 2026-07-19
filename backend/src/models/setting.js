const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'My Retail Shop'
  },
  state: {
    type: String,
    default: 'Maharashtra'
  },
  logoUrl: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: '123 Business Street, Pune, Maharashtra'
  },
  email: {
    type: String,
    default: 'billing@myretailshop.com'
  },
  contact: {
    type: String,
    default: '9876543210'
  },
  gstNumber: {
    type: String,
    default: '27AAAAA0000A1Z5'
  },
  bankDetails: {
    bankName: { type: String, default: 'State Bank of India' },
    accountNo: { type: String, default: '12345678901' },
    ifscCode: { type: String, default: 'SBIN0001234' },
    branch: { type: String, default: 'Shivajinagar Branch' }
  },
  smsTemplates: {
    marathi: {
      type: String,
      default: 'प्रिय {customer_name}, तुमचे थकीत बिल {amount} रुपये प्रलंबित आहे. कृपया लवकरात लवकर भरणा करावा. धन्यवाद, {company_name}.'
    },
    english: {
      type: String,
      default: 'Dear {customer_name}, your outstanding payment of Rs. {amount} is pending. Please pay at the earliest. Thank you, {company_name}.'
    }
  },
  whatsappProvider: {
    type: String,
    default: 'meta'
  },
  whatsappPhoneId: {
    type: String,
    default: ''
  },
  whatsappToken: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Setting', settingSchema);
