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
import CreateStudioScreen from '../screens/CreateStudioScreen';
import AddResourceScreen from '../screens/AddResourceScreen';
import MyStudiosScreen from '../screens/MyStudiosScreen';  
import StudioResourcesScreen from '../screens/StudioResourcesScreen';  
import OwnerDashboardScreen from '../screens/OwnerDashboardScreen'; 
import ProfileScreen from '../screens/ProfileScreen';  


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
        <Stack.Screen name="Profile" component={ProfileScreen}/>


        {/* Owner Screens */}
        <Stack.Screen name="OwnerHome" component={OwnerHomeScreen} />
        <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen}/>
        <Stack.Screen name="PendingApprovals" component={PendingApprovalsScreen} />
        <Stack.Screen name="AllStudioBookings" component={AllStudioBookingsScreen} />
        <Stack.Screen name="CreateStudio" component={CreateStudioScreen} />
        <Stack.Screen name="AddResource" component={AddResourceScreen} />
        <Stack.Screen name="MyStudios" component={MyStudiosScreen} />  
        <Stack.Screen name="StudioResources" component={StudioResourcesScreen} />  
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}