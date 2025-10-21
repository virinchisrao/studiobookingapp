// frontend/src/screens/AllStudioBookingsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { bookingAPI } from '../services/api';

export default function AllStudioBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadBookings();
  }, []);

  // Reload when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBookings();
    });
    return unsubscribe;
  }, [navigation]);

  // Apply filter when bookings or filter changes
  useEffect(() => {
    applyFilter();
  }, [bookings, selectedFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingAPI.getMyStudioBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const applyFilter = () => {
    if (selectedFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter((b) => b.status === selectedFilter);
      setFilteredBookings(filtered);
    }
  };

  const getStatusCounts = () => {
    return {
      all: bookings.length,
      pending_approval: bookings.filter((b) => b.status === 'pending_approval').length,
      approved: bookings.filter((b) => b.status === 'approved').length,
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      rejected: bookings.filter((b) => b.status === 'rejected').length,
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_approval':
        return '⏳';
      case 'approved':
        return '✅';
      case 'confirmed':
        return '🎉';
      case 'rejected':
        return '❌';
      case 'cancelled':
        return '🚫';
      case 'completed':
        return '✔️';
      default:
        return '📋';
    }
  };

  const renderFilterButton = (filter, label) => {
    const counts = getStatusCounts();
    const isActive = selectedFilter === filter;
    const count = counts[filter] || 0;

    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setSelectedFilter(filter)}
      >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {label}
        </Text>
        {count > 0 && (
          <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
            <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
      </View>

      {/* Booking ID */}
      <Text style={styles.bookingId}>Booking #{item.booking_id}</Text>

      {/* Customer Info */}
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>👤</Text>
        <Text style={styles.infoText}>Customer ID: {item.user_id}</Text>
      </View>

      {/* Studio & Resource Info */}
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>🏢</Text>
        <Text style={styles.infoText}>Studio ID: {item.studio_id}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>🎵</Text>
        <Text style={styles.infoText}>Resource ID: {item.resource_id}</Text>
      </View>

      {/* Date & Time */}
      <View style={styles.dateTimeContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoText}>{formatDate(item.booking_date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>⏰</Text>
          <Text style={styles.infoText}>
            {formatTime(item.start_time)} - {formatTime(item.end_time)}
          </Text>
        </View>
      </View>

      {/* Duration */}
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>⏱️</Text>
        <Text style={styles.infoText}>{item.duration_minutes} minutes</Text>
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Amount:</Text>
        <Text style={styles.amountValue}>
          ₹{parseFloat(item.total_amount).toLocaleString('en-IN')}
        </Text>
      </View>

      {/* Rejection/Cancellation Reason */}
      {item.rejection_reason && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Rejection Reason:</Text>
          <Text style={styles.reasonText}>{item.rejection_reason}</Text>
        </View>
      )}

      {item.cancel_reason && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Cancellation:</Text>
          <Text style={styles.reasonText}>{item.cancel_reason}</Text>
          {item.refund_amount && (
            <Text style={styles.refundText}>
              Refund: ₹{parseFloat(item.refund_amount).toLocaleString('en-IN')}
            </Text>
          )}
        </View>
      )}

      {/* Created Date */}
      <Text style={styles.createdText}>
        Created: {formatDateTime(item.created_at)}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>
        {selectedFilter === 'all' ? 'No Bookings Yet' : `No ${getStatusText(selectedFilter)} Bookings`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === 'all'
          ? 'Bookings from customers will appear here'
          : `Try selecting a different filter`}
      </Text>
      {selectedFilter !== 'all' && (
        <TouchableOpacity
          style={styles.showAllButton}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={styles.showAllButtonText}>Show All Bookings</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  const counts = getStatusCounts();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Bookings</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{counts.all}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersScrollView}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('pending_approval', 'Pending')}
          {renderFilterButton('approved', 'Approved')}
          {renderFilterButton('confirmed', 'Confirmed')}
          {renderFilterButton('completed', 'Completed')}
          {renderFilterButton('cancelled', 'Cancelled')}
          {renderFilterButton('rejected', 'Rejected')}
        </View>
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.booking_id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
      />
    </View>
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
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  totalBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  totalText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 10,
  },
  filtersScrollView: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#ddd',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  filterBadgeActive: {
    backgroundColor: '#fff',
  },
  filterBadgeText: {
    fontSize: 11,
    color: '#666',
    fontWeight: 'bold',
  },
  filterBadgeTextActive: {
    color: '#007AFF',
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  bookingId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dateTimeContainer: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  reasonContainer: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  reasonLabel: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  refundText: {
    fontSize: 13,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 6,
  },
  createdText: {
    fontSize: 11,
    color: '#999',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  showAllButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  showAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});