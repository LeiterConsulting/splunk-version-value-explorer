import { createRoot } from 'react-dom/client';
import Ripple from './Ripple';

const root = document.getElementById('ripple-root');
if (root) createRoot(root).render(<Ripple />);
