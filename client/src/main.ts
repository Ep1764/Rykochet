import './styles/reset.css';
import './styles/variables.css';
import './styles/layout.css';
import './styles/login.css';
import './styles/menu.css';

import { mountLogin } from './screens/login.js';
import { mountMenu } from './screens/menu.js';
import { ScreenManager } from './ui/screen-manager.js';

const manager = new ScreenManager();
mountLogin(manager);
mountMenu(manager);

manager.show('login');
