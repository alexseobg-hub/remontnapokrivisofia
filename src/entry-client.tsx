import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const container = document.getElementById('root');

if (container) {
  const tree = (
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );

  // Статичният HTML вече е готов, затова се закачаме върху него вместо да рендираме наново.
  if (container.hasChildNodes()) hydrateRoot(container, tree);
  else createRoot(container).render(tree);
}
