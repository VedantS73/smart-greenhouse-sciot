import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import SimulatorApp from './SimulatorApp';
import 'antd/dist/reset.css';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#f59e0b',
          borderRadius: 8,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }
      }}
    >
      <SimulatorApp />
    </ConfigProvider>
  </React.StrictMode>
);
