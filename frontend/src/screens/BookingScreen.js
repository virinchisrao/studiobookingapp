// frontend/src/screens/BookingScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { bookingAPI } from '../services/api';

export default function BookingScreen({ route, navigation }) {
  const { resource, studio } = route.params;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load slots when date changes
  useEffect(() => {
    loadAvailableSlots();
  }, [selectedDate]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const dateString = formatDateForAPI(selectedDate);
      const data = await bookingAPI.getAvailableSlots(resource.resource_id, dateString);
      setSlots(data);
      setSelectedSlots([]); // Clear selection when changing date
    } catch (error) {
      console.error('Error loading slots:', error);
      Alert.alert('Error', 'Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSlotPress = (slot) => {
    if (!slot.is_available) {
      Alert.alert('Unavailable', 'This time slot is already booked');
      return;
    }

    const slotKey = `${slot.start_time}-${slot.end_time}`;
    const isSelected = selectedSlots.some(
      (s) => `${s.start_time}-${s.end_time}` === slotKey
    );

    if (isSelected) {
      // Deselect
      setSelectedSlots(selectedSlots.filter(
        (s) => `${s.start_time}-${s.end_time}` !== slotKey
      ));
    } else {
      // Select
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const calculateTotalPrice = () => {
    return selectedSlots.reduce((total, slot) => {
      return total + parseFloat(slot.price);
    }, 0);
  };

  const calculateDuration = () => {
    return selectedSlots.length * 30; // Each slot is 30 minutes
  };

  const getStartEndTime = () => {
    if (selectedSlots.length === 0) return null;

    const sortedSlots = [...selectedSlots].sort((a, b) => {
      return a.start_time.localeCompare(b.start_time);
    });

    return {
      start: sortedSlots[0].start_time,
      end: sortedSlots[sortedSlots.length - 1].end_time,
    };
  };

  const handleCreateBooking = async () => {
    if (selectedSlots.length === 0) {
      Alert.alert('Error', 'Please select at least one time slot');
      return;
    }

    const times = getStartEndTime();

    Alert.alert(
      'Confirm Booking',
      `Book ${resource.name} on ${formatDateDisplay(selectedDate)}\n\n` +
      `Time: ${formatTime(times.start)} - ${formatTime(times.end)}\n` +
      `Duration: ${calculateDuration()} minutes\n` +
      `Total: ₹${calculateTotalPrice().toLocaleString('en-IN')}\n\n` +
      `Your booking will be sent for owner approval.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: confirmBooking },
      ]
    );
  };

  const confirmBooking = async () => {
    try {
      setCreating(true);
      const times = getStartEndTime();

      const bookingData = {
        resource_id: resource.resource_id,
        booking_date: formatDateForAPI(selectedDate),
        start_time: times.start,
        end_time: times.end,
      };

      await bookingAPI.createBooking(bookingData);

      Alert.alert(
        'Booking Created! 🎉',
        `Your booking request has been sent to the studio owner for approval.\n\n` +
        `You'll be notified once it's approved.`,
        [
          {
            text: 'View My Bookings',
            onPress: () => navigation.navigate('MyBookings'),
          },
          {
            text: 'Done',
            onPress: () => navigation.navigate('CustomerHome'),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      
      let errorMessage = 'Failed to create booking. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      Alert.alert('Booking Failed', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const isSlotSelected = (slot) => {
    const slotKey = `${slot.start_time}-${slot.end_time}`;
    return selectedSlots.some(
      (s) => `${s.start_time}-${s.end_time}` === slotKey
    );
  };

  const getMinDate = () => {
    return new Date();
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2); // 2 months ahead
    return maxDate;
  };

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
        <Text style={styles.headerTitle}>Book Space</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Resource Info */}
        <View style={styles.resourceCard}>
          <Text style={styles.resourceName}>{resource.name}</Text>
          <Text style={styles.studioName}>{studio.name}</Text>
          <Text style={styles.priceInfo}>
            ₹{parseFloat(resource.base_price_per_hour).toLocaleString('en-IN')}/hour
          </Text>
        </View>

        {/* Date Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={styles.dateText}>{formatDateDisplay(selectedDate)}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              minimumDate={getMinDate()}
              maximumDate={getMaxDate()}
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Time Slots (30 min each)
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading slots...</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map((slot, index) => {
                const selected = isSlotSelected(slot);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.slotButton,
                      !slot.is_available && styles.slotUnavailable,
                      selected && styles.slotSelected,
                    ]}
                    onPress={() => handleSlotPress(slot)}
                    disabled={!slot.is_available}
                  >
                    <Text
                      style={[
                        styles.slotTime,
                        !slot.is_available && styles.slotTimeUnavailable,
                        selected && styles.slotTimeSelected,
                      ]}
                    >
                      {formatTime(slot.start_time)}
                    </Text>
                    <Text
                      style={[
                        styles.slotPrice,
                        !slot.is_available && styles.slotPriceUnavailable,
                        selected && styles.slotPriceSelected,
                      ]}
                    >
                      {slot.is_available ? `₹${slot.price}` : 'Booked'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendAvailable]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendSelected]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendBooked]} />
              <Text style={styles.legendText}>Booked</Text>
            </View>
          </View>
        </View>

        {/* Selected Summary */}
        {selectedSlots.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Selected Slots:</Text>
              <Text style={styles.summaryValue}>{selectedSlots.length}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{calculateDuration()} minutes</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount:</Text>
              <Text style={styles.summaryValueHighlight}>
                ₹{calculateTotalPrice().toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}

        {/* Spacing for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      {selectedSlots.length > 0 && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={[styles.bookButton, creating && styles.bookButtonDisabled]}
            onPress={handleCreateBooking}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookButtonText}>
                Request Booking - ₹{calculateTotalPrice().toLocaleString('en-IN')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  scrollView: {
    flex: 1,
  },
  resourceCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  resourceName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  studioName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceInfo: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  slotButton: {
    width: '31%',
    margin: '1%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  slotUnavailable: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  slotSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  slotTimeUnavailable: {
    color: '#999',
  },
  slotTimeSelected: {
    color: '#fff',
  },
  slotPrice: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  slotPriceUnavailable: {
    color: '#999',
  },
  slotPriceSelected: {
    color: '#fff',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendAvailable: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  legendSelected: {
    backgroundColor: '#007AFF',
  },
  legendBooked: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  summaryValueHighlight: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});