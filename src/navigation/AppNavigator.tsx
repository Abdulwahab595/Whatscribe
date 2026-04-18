import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LanguageSettingsScreen from '../screens/LanguageSettingsScreen';
import SubscriptionSettingsScreen from '../screens/SubscriptionSettingsScreen';
import BackupSettingsScreen from '../screens/BackupSettingsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ResultScreen from '../screens/ResultScreen';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Onboarding: undefined;
  Processing: {audioUri: string; audioDuration: number};
  History: undefined;
  Settings: undefined;
  LanguageSettings: undefined;
  SubscriptionSettings: undefined;
  BackupSettings: undefined;
  Result: {
    transcript: string;
    bullets: string[];
    fullSummary: string;
    fullTranslation: string;
    readSeconds: number;
    audioDuration: number;
    autoShowFullMessage?: boolean;
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
        name="Onboarding"
        component={OnboardingScreen}
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
        name="LanguageSettings"
        component={LanguageSettingsScreen}
        options={{title: 'Language', headerBackTitle: 'Back'}}
      />
      <Stack.Screen
        name="SubscriptionSettings"
        component={SubscriptionSettingsScreen}
        options={{title: 'Plan & Billing', headerBackTitle: 'Back'}}
      />
      <Stack.Screen
        name="BackupSettings"
        component={BackupSettingsScreen}
        options={{title: 'Backup & Restore', headerBackTitle: 'Back'}}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{title: 'Result', headerBackTitle: 'Back'}}
      />
    </Stack.Navigator>
  );
}
