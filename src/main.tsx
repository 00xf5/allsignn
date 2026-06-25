import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import BotGate from './components/BotGate.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BotGate>
      <App />
    </BotGate>
  </StrictMode>,
);
