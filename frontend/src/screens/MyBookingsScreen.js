// frontend/src/screens/MyBookingsScreen.js

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

export default function MyBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingAPI.getMyBookings();
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

  const handleCancelBooking = (booking) => {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      Alert.alert('Cannot Cancel', 'This booking cannot be cancelled');
      return;
    }

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?\n\nCancellation Policy:\n' +
      '• >24 hours before: 80% refund\n' +
      '• <24 hours before: No refund',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => confirmCancellation(booking),
        },
      ]
    );
  };

  const confirmCancellation = async (booking) => {
    Alert.prompt(
      'Cancellation Reason',
      'Please provide a reason for cancellation:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (reason) => {
            if (!reason || reason.trim().length < 5) {
              Alert.alert('Error', 'Please provide a valid reason (at least 5 characters)');
              return;
            }
            await processCancellation(booking, reason);
          },
        },
      ],
      'plain-text',
      'e.g., Schedule conflict'
    );
  };

  const processCancellation = async (booking, reason) => {
    try {
      const result = await bookingAPI.cancelBooking(booking.booking_id, {
        cancel_reason: reason,
      });

      const refundInfo = result.refund_percentage > 0
        ? `You will receive ${result.refund_percentage}% refund (₹${parseFloat(result.refund_amount).toLocaleString('en-IN')})`
        : 'No refund applicable';

      Alert.alert(
        'Booking Cancelled',
        `Your booking has been cancelled.\n\n${refundInfo}`,
        [{ text: 'OK', onPress: () => loadBookings() }]
      );
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert(
        'Cancellation Failed',
        error.response?.data?.detail || 'Failed to cancel booking'
      );
    }
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
        return 'Pending Approval';
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

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
      </View>

      {/* Booking ID */}
      <Text style={styles.bookingId}>Booking #{item.booking_id}</Text>

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
        <Text style={styles.amountLabel}>Total Amount:</Text>
        <Text style={styles.amountValue}>
          ₹{parseFloat(item.total_amount).toLocaleString('en-IN')}
        </Text>
      </View>

      {/* Rejection/Cancellation Reason */}
      {item.rejection_reason && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.rejection_reason}</Text>
        </View>
      )}

      {item.cancel_reason && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Cancellation Reason:</Text>
          <Text style={styles.reasonText}>{item.cancel_reason}</Text>
          {item.refund_amount && (
            <Text style={styles.refundText}>
              Refund: ₹{parseFloat(item.refund_amount).toLocaleString('en-IN')} ({item.refund_percentage}%)
            </Text>
          )}
        </View>
      )}

      {/* Created Date */}
      <Text style={styles.createdText}>
        Created: {new Date(item.created_at).toLocaleString('en-IN')}
      </Text>

      {/* Cancel Button */}
      {(item.status === 'pending_approval' || item.status === 'approved') && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelBooking(item)}
        >
          <Text style={styles.cancelButtonText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>No Bookings Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start booking studios to see your bookings here
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('StudioList')}
      >
        <Text style={styles.browseButtonText}>Browse Studios</Text>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Bookings List */}
      <FlatList
        data={bookings}
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
  cancelButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});