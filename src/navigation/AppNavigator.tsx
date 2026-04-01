import React from 'react';

import {createStackNavigator} from '@react-navigation/stack';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ResultScreen from '../screens/ResultScreen';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Processing: {audioUri: string; audioDuration: number};
  History: undefined;
  Settings: undefined;
  Result: {
    transcript: string;
    bullets: string[];
    readSeconds: number;
    audioDuration: number;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Processing" component={ProcessingScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
}
