// frontend/src/screens/PendingApprovalsScreen.js

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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { bookingAPI } from '../services/api';
import { enrichBookingsWithNames, getResourceIcon } from '../utils/bookingHelpers';

export default function PendingApprovalsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  
  // Rejection modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingBookings();
  }, []);

  // Reload when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPendingBookings();
    });
    return unsubscribe;
  }, [navigation]);

const loadPendingBookings = async () => {
  try {
    setLoading(true);
    const data = await bookingAPI.getPendingApprovals();
    
    // Enrich with names
    const enrichedData = await enrichBookingsWithNames(data);
    setBookings(enrichedData);
  } catch (error) {
    console.error('Error loading pending bookings:', error);
    Alert.alert('Error', 'Failed to load pending bookings');
  } finally {
    setLoading(false);
  }
};
  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingBookings();
    setRefreshing(false);
  };

  const handleApprove = (booking) => {
    Alert.alert(
      'Approve Booking',
      `Approve booking #${booking.booking_id}?\n\n` +
      `Customer will be notified and can proceed with payment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => processApproval(booking, true),
        },
      ]
    );
  };

  const handleReject = (booking) => {
    // Open custom rejection modal (works on Android & iOS)
    setSelectedBooking(booking);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      Alert.alert('Error', 'Please provide a valid reason (at least 5 characters)');
      return;
    }

    setShowRejectModal(false);
    await processApproval(selectedBooking, false, rejectionReason);
  };

  const processApproval = async (booking, approve, rejectionReason = null) => {
    try {
      setProcessingId(booking.booking_id);

      const approvalData = {
        approve: approve,
        rejection_reason: approve ? null : rejectionReason,
      };

      await bookingAPI.approveBooking(booking.booking_id, approvalData);

      Alert.alert(
        approve ? 'Booking Approved! ✅' : 'Booking Rejected',
        approve
          ? 'The customer has been notified and can proceed with payment.'
          : 'The customer has been notified of the rejection.',
        [{ text: 'OK', onPress: () => loadPendingBookings() }]
      );
    } catch (error) {
      console.error('Error processing approval:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to process booking'
      );
    } finally {
      setProcessingId(null);
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

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBookingItem = ({ item }) => {
    const isProcessing = processingId === item.booking_id;

    return (
      <View style={styles.bookingCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.bookingId}>Booking #{item.booking_id}</Text>
            <Text style={styles.requestTime}>
              Requested: {formatDateTime(item.created_at)}
            </Text>
          </View>
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>⏰ PENDING</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <Text style={styles.infoText}>User ID: {item.user_id}</Text>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>

           {/* NEW: Studio & Resource Names */}
  <View style={styles.detailRow}>
    <Text style={styles.detailIcon}>🏢</Text>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>Studio</Text>
      <Text style={styles.detailValue}>{item.studio_name}</Text>
    </View>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.detailIcon}>{getResourceIcon(item.resource_type)}</Text>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>Resource</Text>
      <Text style={styles.detailValue}>{item.resource_name}</Text>
    </View>
  </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(item.booking_date)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⏰</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {formatTime(item.start_time)} - {formatTime(item.end_time)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⏱️</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{item.duration_minutes} minutes</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🏢</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Resource ID</Text>
              <Text style={styles.detailValue}>{item.resource_id}</Text>
            </View>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>
            ₹{parseFloat(item.total_amount).toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleReject(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.rejectButtonText}>❌ Reject</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.approveButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleApprove(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.approveButtonText}>✅ Approve</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>✨</Text>
      <Text style={styles.emptyTitle}>No Pending Approvals</Text>
      <Text style={styles.emptySubtitle}>
        You're all caught up! New booking requests will appear here.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={loadPendingBookings}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading pending bookings...</Text>
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
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{bookings.length}</Text>
        </View>
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

      {/* Rejection Modal (Works on Android!) */}
      <Modal
        visible={showRejectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Booking</Text>
            <Text style={styles.modalSubtitle}>
              Booking #{selectedBooking?.booking_id}
            </Text>
            
            <Text style={styles.inputLabel}>Reason for rejection:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Resource not available"
              placeholderTextColor="#999"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalRejectButton}
                onPress={submitRejection}
              >
                <Text style={styles.modalRejectButtonText}>Reject Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  countBadge: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bookingId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
  },
  urgentBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  detailIcon: {
    fontSize: 18,
    marginRight: 10,
    width: 24,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  amountContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
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
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  modalRejectButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  modalRejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});