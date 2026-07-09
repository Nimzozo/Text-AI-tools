import * as dom from './dom.js';
import { handleToggleSecret } from './ui.js';
import {
  handleAuthClick,
  handleLoginClick
} from './auth.js';

async function init() {
  // Event listeners
  dom.authButton?.addEventListener('click', handleAuthClick);
  dom.loginButton?.addEventListener('click', handleLoginClick);
  dom.revealKeyButton?.addEventListener('click', handleToggleSecret);
}

init();