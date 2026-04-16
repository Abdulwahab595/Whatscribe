import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';

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
    fullSummary: string;
    readSeconds: number;
    audioDuration: number;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{headerShown: false, gestureEnabled: false}}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Processing"
        component={ProcessingScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{title: 'History', headerBackTitle: 'Back'}}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{title: 'Settings', headerBackTitle: 'Back'}}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{title: 'Result', headerBackTitle: 'Back'}}
      />
    </Stack.Navigator>
  );
}
