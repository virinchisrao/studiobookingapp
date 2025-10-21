// frontend/src/screens/OwnerHomeScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OwnerHomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        setUserData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎵 Studio Booking</Text>
        <Text style={styles.subtitle}>Owner Dashboard</Text>
      </View>

      {/* Welcome Message */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>
          Welcome, {userData?.name || 'Owner'}! 👋
        </Text>
        <Text style={styles.roleText}>Role: {userData?.role}</Text>
        <Text style={styles.emailText}>{userData?.email}</Text>
      </View>

      {/* Menu Options */}
      <View style={styles.menu}>
        <Text style={styles.menuTitle}>Studio Management</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('MyStudios')}
        >
          <Text style={styles.menuItemText}>🏢 My Studios</Text>
          <Text style={styles.menuItemSubtext}>Manage your studios and resources</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('PendingApprovals')}
        >
          <Text style={styles.menuItemText}>⏰ Pending Approvals</Text>
          <Text style={styles.menuItemSubtext}>Review and approve booking requests</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('AllStudioBookings')}
        >
          <Text style={styles.menuItemText}>📊 All Bookings</Text>
          <Text style={styles.menuItemSubtext}>View all bookings for your studios</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('CreateStudio')}
        >
          <Text style={styles.menuItemText}>➕ Create New Studio</Text>
          <Text style={styles.menuItemSubtext}>Add a new studio to your listings</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Success Message */}
      <View style={styles.successBanner}>
        <Text style={styles.successText}>✅ Login Successful!</Text>
        <Text style={styles.successSubtext}>
          Owner dashboard ready! 🎉
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  roleText: {
    fontSize: 14,
    color: '#FF9500',
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
  },
  menu: {
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 5,
  },
  menuItemSubtext: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successBanner: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  successText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  successSubtext: {
    color: '#fff',
    fontSize: 14,
  },
});