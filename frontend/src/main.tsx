import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ConfigConst } from './config.const.ts'
import { authenticateUser } from './utils/authenticate.ts'
import { getLsCredentials } from './utils/ls-credentials.ts'

async function loadConfig() {
  const promise = await fetch('./config.json')
  return await promise.json();
}

loadConfig().then(async (config) => {
  ConfigConst.apiUrl = config['apiUrl'];

  let isAuth = true; //false;     Skip the login xD
  const {username, password} = getLsCredentials(); 

  if(username && password) {
    isAuth = true;
  } else {
   // isAuth = await authenticateUser();
  }

  if(isAuth) {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
}).catch(err => {
  console.error("Failed to load the application with error", err);
});

