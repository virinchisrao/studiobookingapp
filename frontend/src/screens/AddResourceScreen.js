// frontend/src/screens/AddResourceScreen.js

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
import { resourceAPI } from '../services/api';

export default function AddResourceScreen({ route, navigation }) {
  const { studio } = route.params;

  const [formData, setFormData] = useState({
    name: '',
    resource_type: 'live_room',
    description: '',
    base_price_per_hour: '',
    max_occupancy: '',
  });
  const [loading, setLoading] = useState(false);

  const resourceTypes = [
    { value: 'live_room', label: '🎸 Live Room', icon: '🎸' },
    { value: 'control_room', label: '🎛️ Control Room', icon: '🎛️' },
    { value: 'booth', label: '🎤 Booth', icon: '🎤' },
    { value: 'rehearsal', label: '🥁 Rehearsal Space', icon: '🥁' },
  ];

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    if (!formData.name || formData.name.trim().length < 2) {
      Alert.alert('Validation Error', 'Resource name is required');
      return false;
    }

    if (!formData.base_price_per_hour || parseFloat(formData.base_price_per_hour) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price per hour');
      return false;
    }

    return true;
  };

  const handleAddResource = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const resourceData = {
        name: formData.name.trim(),
        resource_type: formData.resource_type,
        description: formData.description.trim() || null,
        base_price_per_hour: parseFloat(formData.base_price_per_hour),
        max_occupancy: formData.max_occupancy ? parseInt(formData.max_occupancy) : null,
      };

      await resourceAPI.addResourceToStudio(studio.studio_id, resourceData);

      Alert.alert(
        'Resource Added! 🎉',
        `${formData.name} has been added to ${studio.name}.\n\n` +
        `Would you like to add another resource?`,
        [
          {
            text: 'Done',
            onPress: () => navigation.navigate('MyStudios'),
          },
          {
            text: 'Add Another',
            onPress: () => {
              // Reset form
              setFormData({
                name: '',
                resource_type: 'live_room',
                description: '',
                base_price_per_hour: '',
                max_occupancy: '',
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error adding resource:', error);
      
      let errorMessage = 'Failed to add resource. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      Alert.alert('Addition Failed', errorMessage);
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Add Resource</Text>
          <Text style={styles.headerSubtitle}>{studio.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Add bookable spaces like live rooms, control rooms, or booths to your studio.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Resource Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Resource Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Live Room A"
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              editable={!loading}
            />
          </View>

          {/* Resource Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Resource Type *</Text>
            <View style={styles.typeButtons}>
              {resourceTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    formData.resource_type === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => handleInputChange('resource_type', type.value)}
                  disabled={loading}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text
                    style={[
                      styles.typeText,
                      formData.resource_type === type.value && styles.typeTextActive,
                    ]}
                  >
                    {type.label.replace(type.icon + ' ', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the equipment, size, features..."
              placeholderTextColor="#999"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          {/* Price & Occupancy */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1.5 }]}>
              <Text style={styles.label}>Price per Hour (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="1500"
                placeholderTextColor="#999"
                value={formData.base_price_per_hour}
                onChangeText={(value) => handleInputChange('base_price_per_hour', value)}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Max People</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                placeholderTextColor="#999"
                value={formData.max_occupancy}
                onChangeText={(value) => handleInputChange('max_occupancy', value)}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
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
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddResource}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Add Resource</Text>
          )}
        </TouchableOpacity>
      </View>
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
  },
  infoCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
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
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minWidth: '48%',
  },
  typeButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#007AFF',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
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
  addButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});