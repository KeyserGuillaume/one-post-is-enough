import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {Amplify} from 'aws-amplify';
import config from './aws-config.json';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: config.clientId,
      userPoolId: config.userPoolId,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
