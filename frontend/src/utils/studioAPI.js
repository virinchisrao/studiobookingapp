// utils/studioApi.js
import axios from 'axios';
import { API_URL } from './config';

export const createStudio = async (studioData) => {
  try {
    // Clean and validate the data
    const cleanedData = {
      name: studioData.name?.trim() || '',
      description: studioData.description?.trim() || '',
      address: studioData.address?.trim() || '',
      city: studioData.city?.trim() || '',
      state: studioData.state?.trim() || '',
      postal_code: studioData.postal_code?.trim() || '',
      phone: studioData.phone?.trim() || '',
      lat: parseFloat(studioData.lat),
      lng: parseFloat(studioData.lng)
    };

    // Validate required fields including lat/lng
    if (!cleanedData.lat || !cleanedData.lng) {
      throw new Error('Location coordinates are required');
    }

    console.log('Sending to backend:', cleanedData);

    const response = await axios.post(
      `${API_URL}/studios`,
      cleanedData,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating studio:', error);
    throw error;
  }
};