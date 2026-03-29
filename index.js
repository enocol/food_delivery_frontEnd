import { registerRootComponent } from 'expo';
import { getAuth } from "firebase/auth";
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

const auth = getAuth();

auth.languageCode = 'it';
// To apply the default browser preference instead of explicitly setting it.
// auth.useDeviceLanguage();
