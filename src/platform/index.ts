import { platformAdapter } from './nativeAdapter';
export * from './capabilities';
export * from './interface';
export { platformAdapter };
export const getPlatformAdapter = () => platformAdapter;
export { useInputMode } from './inputMode';
