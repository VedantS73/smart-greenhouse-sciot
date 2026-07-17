import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import SimulatorApp from './SimulatorApp';
import 'antd/dist/reset.css';
import './index.css';

const RootComponent = process.env.REACT_APP_SIMULATOR === 'true' ? SimulatorApp : App;
const primaryColor = process.env.REACT_APP_SIMULATOR === 'true' ? '#f59e0b' : '#22c55e';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: primaryColor,
          borderRadius: 8,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }
      }}
    >
      <RootComponent />
    </ConfigProvider>
  </React.StrictMode>
);
