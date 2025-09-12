const axios = require('axios');

const testDepartmentsAPI = async () => {
  try {
    console.log('Testing departments API...');
    
    // Test without authentication first
    const response = await axios.get('http://localhost:5000/api/departments');
    console.log('Response without auth:', response.data);
  } catch (error) {
    console.log('Error without auth (expected):', error.response?.status, error.response?.data?.message);
  }

  try {
    // Test with a dummy token
    const response = await axios.get('http://localhost:5000/api/departments', {
      headers: { Authorization: 'Bearer dummy-token' }
    });
    console.log('Response with dummy token:', response.data);
  } catch (error) {
    console.log('Error with dummy token (expected):', error.response?.status, error.response?.data?.message);
  }
};

testDepartmentsAPI();
