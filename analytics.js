/* Vercel Web Analytics - Inline injection for static site */
(function() {
  'use strict';
  
  // Initialize analytics queue
  if (!window.va) {
    window.va = function() {
      (window.vaq = window.vaq || []).push(arguments);
    };
  }
  
  // Detect environment
  function detectEnvironment() {
    try {
      const env = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV);
      if (env === 'development' || env === 'test') {
        return 'development';
      }
    } catch (e) {}
    return 'production';
  }
  
  const mode = detectEnvironment();
  window.vam = mode;
  
  // Inject the Vercel analytics script
  const src = mode === 'development' 
    ? 'https://cdn.vercel-insights.com/v1/script.debug.js'
    : '/_vercel/insights/script.js';
  
  // Check if script is already loaded
  if (document.head.querySelector('script[src*="' + src + '"]')) {
    return;
  }
  
  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  script.onerror = function() {
    const errorMessage = mode === 'development'
      ? 'Please check if any ad blockers are enabled and try again.'
      : 'Be sure to enable Web Analytics for your project and deploy again. See https://vercel.com/docs/analytics/quickstart for more information.';
    console.log('[Vercel Web Analytics] Failed to load script from ' + src + '. ' + errorMessage);
  };
  
  document.head.appendChild(script);
})();
