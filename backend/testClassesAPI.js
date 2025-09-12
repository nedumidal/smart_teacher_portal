const axios = require('axios');

const testClassesAPI = async () => {
  try {
    console.log('Testing classes API...');
    
    // Test without authentication first
    const response = await axios.get('http://localhost:5000/api/classes');
    console.log('Response without auth:', response.data);
  } catch (error) {
    console.log('Error without auth (expected):', error.response?.status, error.response?.data?.message);
  }

  try {
    // Test with a dummy token
    const response = await axios.get('http://localhost:5000/api/classes', {
      headers: { Authorization: 'Bearer dummy-token' }
    });
    console.log('Response with dummy token:', response.data);
  } catch (error) {
    console.log('Error with dummy token (expected):', error.response?.status, error.response?.data?.message);
  }
};

testClassesAPI();
