// frontend/src/screens/CreateStudioScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { studioAPI } from '../services/api';
import LocationPicker from '../components/LocationPicker';

export default function CreateStudioScreen({ navigation }) {
  const [formData, setFormData] = useState({
  name: '',
  description: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  phone: '',
  lat: '',
  lng: '',
});
  const [loading, setLoading] = useState(false);

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

const validateForm = () => {
  if (!formData.name || formData.name.trim().length < 2) {
    Alert.alert('Validation Error', 'Studio name is required (minimum 2 characters)');
    return false;
  }

  if (!formData.address || formData.address.trim().length < 5) {
    Alert.alert('Validation Error', 'Address is required (minimum 5 characters)');
    return false;
  }

  // NEW: Make location required
  if (!formData.lat || !formData.lng) {
    Alert.alert(
      'Location Required',
      'Please select your studio location on the map.\n\nTap "Select Location on Map" to set the coordinates.'
    );
    return false;
  }

  return true;
};

  const handleCreateStudio = async () => {
  if (!validateForm()) return;

  setLoading(true);

  try {
    const cleanedData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      address: formData.address.trim(),
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      postal_code: formData.postal_code.trim() || null,
      phone: formData.phone.trim() || null,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null,
    };

    console.log('=== CREATING STUDIO ===');
    console.log('Form Data:', formData);
    console.log('Cleaned Data:', cleanedData);
    console.log('Lat:', cleanedData.lat, 'Type:', typeof cleanedData.lat);
    console.log('Lng:', cleanedData.lng, 'Type:', typeof cleanedData.lng);

    const newStudio = await studioAPI.createStudio(cleanedData);
    
    console.log('Created Studio Response:', newStudio);

    Alert.alert(
      'Studio Created! 🎉',
      `${newStudio.name} has been created successfully.\n\n` +
      `Would you like to add resources (rooms) to this studio now?`,
      [
        {
          text: 'Later',
          onPress: () => navigation.navigate('OwnerHome'),
        },
        {
          text: 'Add Resources',
          onPress: () => navigation.navigate('AddResource', { studio: newStudio }),
        },
      ]
    );
  } catch (error) {
    console.error('Error creating studio:', error);
    console.error('Error response:', error.response?.data);
    
    let errorMessage = 'Failed to create studio. Please try again.';
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    }
    
    Alert.alert('Creation Failed', errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Studio</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Your studio will be created in draft mode. You can publish it later after adding resources.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Studio Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Studio Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Sound Studio Mumbai"
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              editable={!loading}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Professional recording studio with state-of-the-art equipment..."
              placeholderTextColor="#999"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Street address"
              placeholderTextColor="#999"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              editable={!loading}
            />
          </View>
          {/* Location Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Studio Location</Text>

          {formData.lat && formData.lng ? (
            <View style={styles.locationPreview}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>📍 Location Set</Text>
                <Text style={styles.locationCoords}>
                  {parseFloat(formData.lat).toFixed(4)}, {parseFloat(formData.lng).toFixed(4)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeLocationButton}
                onPress={() => setShowLocationPicker(true)}
              >
                <Text style={styles.changeLocationText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectLocationButton}
              onPress={() => setShowLocationPicker(true)}
              disabled={loading}
            >
              <Text style={styles.selectLocationIcon}>🗺️</Text>
              <Text style={styles.selectLocationText}>Select Location on Map</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.helpText}>
            Tap to select your studio's exact location on the map
          </Text>
        </View>

          {/* City & State */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Mumbai"
                placeholderTextColor="#999"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
                editable={!loading}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="Maharashtra"
                placeholderTextColor="#999"
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value)}
                editable={!loading}
              />
            </View>
          </View>

          {/* Postal Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Postal Code</Text>
            <TextInput
              style={styles.input}
              placeholder="400050"
              placeholderTextColor="#999"
              value={formData.postal_code}
              onChangeText={(value) => handleInputChange('postal_code', value)}
              keyboardType="number-pad"
              editable={!loading}
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="+912212345678"
              placeholderTextColor="#999"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          {/* Required Fields Note */}
          <Text style={styles.requiredNote}>* Required fields</Text>
        </View>

        {/* Spacing for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateStudio}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Studio</Text>
          )}
        </TouchableOpacity>
      </View>


      {/* Location Picker Modal */}
        <LocationPicker
          visible={showLocationPicker}
          initialLat={formData.lat}
          initialLng={formData.lng}
          onLocationSelect={(lat, lng) => {
            setFormData({
              ...formData,
              lat: lat,
              lng: lng,
            });
          }}
          onClose={() => setShowLocationPicker(false)}
        />
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 15,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  requiredNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
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
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectLocationButton: {
  backgroundColor: '#E3F2FD',
  borderRadius: 8,
  padding: 15,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
  borderColor: '#007AFF',
  borderStyle: 'dashed',
},
selectLocationIcon: {
  fontSize: 24,
  marginRight: 10,
},
selectLocationText: {
  fontSize: 16,
  color: '#007AFF',
  fontWeight: '600',
},
locationPreview: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#E8F5E9',
  padding: 15,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#4CAF50',
},
locationInfo: {
  flex: 1,
},
locationLabel: {
  fontSize: 14,
  color: '#2E7D32',
  fontWeight: '600',
  marginBottom: 4,
},
locationCoords: {
  fontSize: 13,
  color: '#666',
  fontFamily: 'monospace',
},
changeLocationButton: {
  backgroundColor: '#007AFF',
  paddingHorizontal: 15,
  paddingVertical: 8,
  borderRadius: 6,
},
changeLocationText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '600',
},
helpText: {
  fontSize: 12,
  color: '#666',
  fontStyle: 'italic',
  marginTop: 8,
},
});