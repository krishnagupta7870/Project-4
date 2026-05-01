import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { API_ORIGIN } from './utils/api';

// Configure axios globally for direct calls
axios.defaults.baseURL = API_ORIGIN;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId="266571386016-npqreuqbkp42qtf294k9dtdvuckphn6d.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
