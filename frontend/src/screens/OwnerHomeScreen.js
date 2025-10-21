// frontend/src/screens/OwnerHomeScreen.js

import React, { useEffect } from 'react';

export default function OwnerHomeScreen({ navigation }) {
  useEffect(() => {
    // Redirect to dashboard immediately
    navigation.replace('OwnerDashboard');
  }, []);

  return null;
}