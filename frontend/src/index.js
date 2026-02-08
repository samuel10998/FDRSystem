import React from 'react';
import ReactDOM from 'react-dom/client';

// 👉 najprv PrimeReact téma a základné veci
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

// ✅ Font Awesome (lokálne cez npm, bez CDN)
import "@fortawesome/fontawesome-free/css/all.min.css";

// 👉 potom tvoje vlastné štýly
import './index.css';
import './App.css'; // nezabudni ak ho máš
import './components/navigation/navbar.css'; // ✅ uisti sa, že ide po témach

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
