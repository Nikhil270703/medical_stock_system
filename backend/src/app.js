const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();
app.use(helmet());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('tiny'));

// public health check (used by service-discovery)
app.get('/health', (_req, res) => res.json({ ok: true, module: 'result-analysis' }));

// all real routes are gateway-only and tenant/context aware
app.use('/result-analysis', routes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('[result-analysis]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

module.exports = app;
