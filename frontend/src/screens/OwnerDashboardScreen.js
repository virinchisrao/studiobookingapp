// frontend/src/screens/OwnerDashboardScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studioAPI, bookingAPI } from '../services/api';

export default function OwnerDashboardScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalStudios: 0,
    publishedStudios: 0,
    totalBookings: 0,
    pendingApprovals: 0,
    approvedBookings: 0,
    rejectedBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    approvalRate: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
    loadDashboardData();
  }, []);

  // Reload when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });
    return unsubscribe;
  }, [navigation]);

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

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch studios
      const studios = await studioAPI.getMyStudios();
      const publishedStudios = studios.filter((s) => s.is_published).length;

      // Fetch all bookings
      const bookings = await bookingAPI.getMyStudioBookings();

      // Calculate stats
      const pending = bookings.filter((b) => b.status === 'pending_approval').length;
      const approved = bookings.filter((b) => b.status === 'approved').length;
      const rejected = bookings.filter((b) => b.status === 'rejected').length;
      const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
      const completed = bookings.filter((b) => b.status === 'completed').length;
      const confirmed = bookings.filter((b) => b.status === 'confirmed').length;

      // Calculate total revenue (approved + confirmed + completed bookings)
      const revenueBookings = bookings.filter(
        (b) => b.status === 'approved' || b.status === 'confirmed' || b.status === 'completed'
      );
      const totalRevenue = revenueBookings.reduce(
        (sum, b) => sum + parseFloat(b.total_amount),
        0
      );

      // Calculate approval rate
      const totalResponses = approved + rejected;
      const approvalRate = totalResponses > 0 ? ((approved / totalResponses) * 100).toFixed(1) : 0;

      // Get recent bookings (last 5)
      const recent = bookings
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setStats({
        totalStudios: studios.length,
        publishedStudios,
        totalBookings: bookings.length,
        pendingApprovals: pending,
        approvedBookings: approved,
        rejectedBookings: rejected,
        cancelledBookings: cancelled,
        completedBookings: completed,
        confirmedBookings: confirmed,
        totalRevenue,
        approvalRate,
      });

      setRecentBookings(recent);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
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
    ]);
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_approval':
        return '#FF9500';
      case 'approved':
        return '#4CAF50';
      case 'confirmed':
        return '#007AFF';
      case 'rejected':
        return '#FF3B30';
      case 'cancelled':
        return '#999';
      case 'completed':
        return '#34C759';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending_approval':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'confirmed':
        return 'Confirmed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back! 👋</Text>
          <Text style={styles.userName}>{userData?.name || 'Owner'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Total Revenue Card */}
        <View style={[styles.statCard, styles.revenueCard]}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.totalRevenue)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>

        {/* Total Bookings Card */}
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statValue}>{stats.totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
      </View>

      {/* Quick Stats Row */}
      <View style={styles.statsGrid}>
        {/* Pending Approvals */}
        <TouchableOpacity
          style={[styles.statCard, styles.pendingCard]}
          onPress={() => navigation.navigate('PendingApprovals')}
        >
          <Text style={styles.statIcon}>⏰</Text>
          <Text style={styles.statValue}>{stats.pendingApprovals}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </TouchableOpacity>

        {/* Approval Rate */}
        <View style={[styles.statCard, styles.approvalCard]}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statValue}>{stats.approvalRate}%</Text>
          <Text style={styles.statLabel}>Approval Rate</Text>
        </View>
      </View>

      {/* Studios Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Studios Overview</Text>
        <View style={styles.studiosCard}>
          <View style={styles.studiosRow}>
            <View style={styles.studiosItem}>
              <Text style={styles.studiosValue}>{stats.totalStudios}</Text>
              <Text style={styles.studiosLabel}>Total Studios</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.studiosItem}>
              <Text style={styles.studiosValue}>{stats.publishedStudios}</Text>
              <Text style={styles.studiosLabel}>Published</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.studiosItem}>
              <Text style={styles.studiosValue}>
                {stats.totalStudios - stats.publishedStudios}
              </Text>
              <Text style={styles.studiosLabel}>Draft</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('MyStudios')}
          >
            <Text style={styles.viewButtonText}>Manage Studios →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bookings Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bookings Breakdown</Text>
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.breakdownLabel}>Approved</Text>
              <Text style={styles.breakdownValue}>{stats.approvedBookings}</Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: '#007AFF' }]} />
              <Text style={styles.breakdownLabel}>Confirmed</Text>
              <Text style={styles.breakdownValue}>{stats.confirmedBookings}</Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.breakdownLabel}>Completed</Text>
              <Text style={styles.breakdownValue}>{stats.completedBookings}</Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.breakdownLabel}>Rejected</Text>
              <Text style={styles.breakdownValue}>{stats.rejectedBookings}</Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: '#999' }]} />
              <Text style={styles.breakdownLabel}>Cancelled</Text>
              <Text style={styles.breakdownValue}>{stats.cancelledBookings}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('AllStudioBookings')}
          >
            <Text style={styles.viewButtonText}>View All Bookings →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Bookings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        {recentBookings.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Text style={styles.emptyRecentText}>No bookings yet</Text>
          </View>
        ) : (
          <View style={styles.recentCard}>
            {recentBookings.map((booking, index) => (
              <View
                key={booking.booking_id}
                style={[styles.recentItem, index !== 0 && styles.recentItemBorder]}
              >
                <View style={styles.recentInfo}>
                  <Text style={styles.recentBookingId}>Booking #{booking.booking_id}</Text>
                  <Text style={styles.recentDate}>{formatDate(booking.booking_date)}</Text>
                </View>
                <View style={styles.recentRight}>
                  <Text style={styles.recentAmount}>
                    {formatCurrency(booking.total_amount)}
                  </Text>
                  <View
                    style={[
                      styles.recentStatus,
                      { backgroundColor: getStatusColor(booking.status) },
                    ]}
                  >
                    <Text style={styles.recentStatusText}>
                      {getStatusText(booking.status)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('PendingApprovals')}
          >
            <Text style={styles.actionIcon}>⏰</Text>
            <Text style={styles.actionText}>Pending Approvals</Text>
            {stats.pendingApprovals > 0 && (
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{stats.pendingApprovals}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('MyStudios')}
          >
            <Text style={styles.actionIcon}>🏢</Text>
            <Text style={styles.actionText}>My Studios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AllStudioBookings')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>All Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('CreateStudio')}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>New Studio</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Spacing at bottom */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 15,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueCard: {
    backgroundColor: '#34C759',
  },
  pendingCard: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  approvalCard: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  studiosCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studiosRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  studiosItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  studiosValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  studiosLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownRow: {
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  viewButton: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyRecent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },
  emptyRecentText: {
    fontSize: 14,
    color: '#999',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  recentInfo: {
    flex: 1,
  },
  recentBookingId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  recentDate: {
    fontSize: 12,
    color: '#666',
  },
  recentRight: {
    alignItems: 'flex-end',
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  recentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recentStatusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  actionIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  actionBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});