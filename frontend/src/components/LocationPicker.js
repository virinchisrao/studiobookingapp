// frontend/src/components/LocationPicker.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function LocationPicker({ initialLat, initialLng, onLocationSelect, visible, onClose }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: initialLat || 19.0760,
    longitude: initialLng || 72.8777,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialLat && initialLng) {
      setSelectedLocation({
        latitude: parseFloat(initialLat),
        longitude: parseFloat(initialLng),
      });
      setRegion({
        latitude: parseFloat(initialLat),
        longitude: parseFloat(initialLng),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [initialLat, initialLng]);

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleUseMyLocation = async () => {
    try {
      setLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is needed to use your current location'
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      setSelectedLocation({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('No Location', 'Please select a location on the map');
      return;
    }

    onLocationSelect(
      selectedLocation.latitude.toFixed(6),
      selectedLocation.longitude.toFixed(6)
    );
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Studio Location</Text>
          <Text style={styles.headerSubtitle}>
            Tap on the map to set the exact location
          </Text>
        </View>

        {/* Map */}
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              draggable
              onDragEnd={handleMapPress}
            >
              <View style={styles.customMarker}>
                <Text style={styles.markerIcon}>📍</Text>
              </View>
            </Marker>
          )}
        </MapView>

        {/* Info Card */}
        {selectedLocation && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Selected Coordinates:</Text>
            <View style={styles.coordsContainer}>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>Latitude:</Text>
                <Text style={styles.coordValue}>
                  {selectedLocation.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>Longitude:</Text>
                <Text style={styles.coordValue}>
                  {selectedLocation.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.myLocationButton}
            onPress={handleUseMyLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.myLocationIcon}>📍</Text>
                <Text style={styles.myLocationText}>Use My Location</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              disabled={!selectedLocation}
            >
              <Text style={styles.confirmButtonText}>
                Confirm Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            💡 Tip: Tap the map or drag the pin to set exact location. Use "My Location" if you're at the studio.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: {
    fontSize: 40,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  coordsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  coordItem: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  coordValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  actions: {
    padding: 15,
  },
  myLocationButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  myLocationIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  myLocationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpContainer: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  helpText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
});