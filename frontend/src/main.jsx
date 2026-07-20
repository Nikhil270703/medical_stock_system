  // Standalone dev harness — runs the module on its own.
  import { mount } from './bootstrap.jsx';

  // In production standalone deployment, we do not inject the mock developer context
  // so that the app shows the Login page and uses VITE_API_URL + real JWT token.
  // In local standalone development, we inject the mock context for testing/harness mode.
  const isProduction = import.meta.env.PROD;

  if (isProduction) {
    mount(document.getElementById('root'), null);
  } else {
    mount(document.getElementById('root'), {
      apiBaseUrl: '/api',
      authToken: 'dev-token',
      tenant: { code: 'DEV', name: 'Dev College' },
      user: { id: 'dev', role: 'college_admin' },
      permissions: ['result_analysis.view', 'result_analysis.create', 'result_analysis.update', 'result_analysis.delete'],
      theme: {},
      eventBus: { emit() {}, on() { return () => {}; } },
    });
  }

