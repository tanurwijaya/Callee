/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import CallRoomScreen from './src/scenes/callRoom/CallRoomScreen';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => CallRoomScreen);
