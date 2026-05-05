import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/app.css';

const container = document.getElementById('app');
if (container) {
  createRoot(container).render(<App />);
}
