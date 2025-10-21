// frontend/src/navigation/AppNavigator.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CustomerHomeScreen from '../screens/CustomerHomeScreen';
import OwnerHomeScreen from '../screens/OwnerHomeScreen';
import StudioDetailsScreen from '../screens/StudioDetailsScreen';
import StudioListScreen from '../screens/StudioListScreen';
import BookingScreen from '../screens/BookingScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import PendingApprovalsScreen from '../screens/PendingApprovalsScreen';
import AllStudioBookingsScreen from '../screens/AllStudioBookingsScreen';


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
        <Stack.Screen name="StudioList" component={StudioListScreen}/>
        <Stack.Screen name="StudioDetails" component={StudioDetailsScreen}/>
        <Stack.Screen name="Booking" component={BookingScreen}/>
        <Stack.Screen name="MyBookings" component={MyBookingsScreen}/>

        {/* Owner Screens */}
        <Stack.Screen name="OwnerHome" component={OwnerHomeScreen} />
        <Stack.Screen name="PendingApprovals" component={PendingApprovalsScreen} />
        <Stack.Screen name="AllStudioBookings" component={AllStudioBookingsScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}