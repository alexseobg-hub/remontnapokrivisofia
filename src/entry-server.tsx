import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';
import { headSink, renderHeadTags, type Head } from './lib/seo';
import './index.css';

export interface Rendered {
  html: string;
  head: string;
  title: string;
}

export function render(url: string): Rendered {
  headSink.current = null;

  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );

  const head = headSink.current as Head | null;
  return {
    html,
    head: head ? renderHeadTags(head) : '',
    title: head?.title ?? 'Ремонт на покриви София',
  };
}

/** Адресите, които prerender.js трябва да изпише като файлове. */
export { routes } from './lib/routes';
