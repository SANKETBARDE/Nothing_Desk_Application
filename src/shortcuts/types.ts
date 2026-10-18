export interface ShortcutAction {
  id: string;
  name: string;
  description: string;
  keys: string[]; // e.g. ['Control', 'Space'] or ['Meta', 'd']
  handler: (e: KeyboardEvent) => void;
  allowInInputs?: boolean;
}

export type KeyCombo = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};
