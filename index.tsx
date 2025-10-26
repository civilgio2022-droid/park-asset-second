import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const domNode = document.getElementById('root');
// FIX: Import ReactDOM from 'react-dom/client' to resolve UMD global and createRoot errors.
const root = ReactDOM.createRoot(domNode!);
root.render(<App />);
