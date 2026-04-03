/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import ShareModal from './src/ShareModal';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('WhatscribeShare', () => ShareModal);
