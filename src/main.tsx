import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import BotGate from './components/BotGate.tsx';
import './index.css';

const App = lazy(() => import('./App.tsx'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BotGate>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </BotGate>
  </StrictMode>,
);
