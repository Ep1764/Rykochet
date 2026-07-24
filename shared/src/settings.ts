export type KeyBinding = [string | null, string | null, string | null];

export interface Keybinds {
  moveUp: KeyBinding;
  moveLeft: KeyBinding;
  moveDown: KeyBinding;
  moveRight: KeyBinding;
  heavy: KeyBinding;
  special: KeyBinding;
}

export type GraphicsQuality = 'low' | 'med' | 'high';

export interface AccountSettings {
  keybinds: Keybinds;
  languageFilter: boolean;
  graphicsQuality: GraphicsQuality;
  showFps: boolean;
  musicOn: boolean;
  sfxOn: boolean;
}

export const DEFAULT_SETTINGS: AccountSettings = {
  keybinds: {
    moveUp:    ['W',     'ArrowUp',      null],
    moveLeft:  ['A',     'ArrowLeft',    null],
    moveDown:  ['S',     'ArrowDown',    null],
    moveRight: ['D',     'ArrowRight',   null],
    heavy:     ['Shift', 'ControlRight', null],
    special:   ['Space', 'Enter',        null],
  },
  languageFilter: true,
  graphicsQuality: 'med',
  showFps: false,
  musicOn: true,
  sfxOn: true,
};
