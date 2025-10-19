// frontend/src/navigation/AppNavigator.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CustomerHomeScreen from '../screens/CustomerHomeScreen';
import OwnerHomeScreen from '../screens/OwnerHomeScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Hide header for all screens
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* Customer Screens */}
        <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />

        {/* Owner Screens */}
        <Stack.Screen name="OwnerHome" component={OwnerHomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}