import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import BotGate from './components/BotGate.tsx';
import { getGateSession } from './utils/session';
import { setBrowserGateCookie } from './utils/gateCookie';
import './index.css';

function loadAppModule() {
  const session = getGateSession();
  if (!session) {
    return Promise.reject(new Error('Gate session required'));
  }

  setBrowserGateCookie(session.accessToken, session.expiresAt);
  const gate = encodeURIComponent(session.accessToken);
  return import(`./App.tsx?gate=${gate}`);
}

const App = lazy(loadAppModule);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BotGate>
      <Suspense fallback={<div className="min-h-screen bg-[#111]" />}>
        <App />
      </Suspense>
    </BotGate>
  </StrictMode>,
);
