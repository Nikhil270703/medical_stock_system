module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || '0.0.0.0',
  PORT: Number(process.env.PORT) || 4009,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_information_system',
  JWT_INTERNAL_PUBLIC_KEY: process.env.JWT_INTERNAL_PUBLIC_KEY || '',
  CORE_INTERNAL_AUD: process.env.CORE_INTERNAL_AUD || 'result-analysis',
};
