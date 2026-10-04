import React from 'react';
import { createRoot } from 'react-dom/client';
import { Agentation } from 'agentation';

// Independent root: never render into or alter the captured Next application.
if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
    && new URLSearchParams(location.search).get('feedback') !== 'off') {
  const mount = () => {
    if (document.getElementById('prototype-feedback-root')) return;
    const host = document.createElement('div');
    host.id = 'prototype-feedback-root';
    document.body.appendChild(host);
    createRoot(host).render(
      <Agentation appName="Chengzhang Portfolio Prototype" enableKeyboardShortcuts={false} />,
    );
  };
  // Wait until the captured page has hydrated before adding the independent root.
  if (document.readyState === 'complete') setTimeout(mount, 2000);
  else window.addEventListener('load', () => setTimeout(mount, 2000), { once: true });
}
