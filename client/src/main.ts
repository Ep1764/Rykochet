import './styles/reset.css';
import './styles/variables.css';
import './styles/layout.css';
import './styles/panels.css';
import './styles/login.css';
import './styles/menu.css';
import './styles/stats-bar.css';
import './styles/settings.css';
import './styles/quickplay.css';
import './styles/parties.css';
import './styles/lobby.css';
import './styles/shop.css';
import './styles/avatar.css';
import './styles/updates.css';

import { mountAvatar } from './screens/avatar.js';
import { mountLobby } from './screens/lobby.js';
import { mountLogin } from './screens/login.js';
import { mountMenu } from './screens/menu.js';
import { mountParties } from './screens/parties.js';
import { mountQuickPlay } from './screens/quickplay.js';
import { mountShop } from './screens/shop.js';
import { mountTutorial } from './screens/tutorial.js';
import { mountUpdates } from './screens/updates.js';
import { ScreenManager } from './ui/screen-manager.js';
import { mountSettingsModal } from './ui/settings-modal.js';
import { mountStatsBar } from './ui/stats-bar.js';

const manager = new ScreenManager();
const settings = mountSettingsModal();

mountLogin(manager);
mountMenu(manager);
mountQuickPlay(manager);
mountParties(manager);
mountLobby(manager);
mountShop(manager);
mountTutorial(manager);
mountAvatar(manager);
mountUpdates(manager);

mountStatsBar(manager, settings.open);

manager.show('login');
