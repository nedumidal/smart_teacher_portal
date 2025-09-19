const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API endpoints...');
    
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('Health check:', healthResponse.data);
    
    // Test login
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'rajesh.kumar@college.com',
      password: 'password123'
    });
    console.log('Login successful:', loginResponse.data.success);
    const token = loginResponse.data.token;
    
    // Test teacher dashboard stats
    console.log('\n3. Testing teacher dashboard stats...');
    const dashboardResponse = await axios.get('http://localhost:5000/api/teachers/dashboard-stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Dashboard stats:', dashboardResponse.data);
    
    // Test leave limits
    console.log('\n4. Testing leave limits...');
    const limitsResponse = await axios.get('http://localhost:5000/api/teachers/leave-limits', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Leave limits:', limitsResponse.data);
    
    // Test leave balances
    console.log('\n5. Testing leave balances...');
    const balancesResponse = await axios.get('http://localhost:5000/api/teachers/leave-balances', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Leave balances:', balancesResponse.data);
    
    console.log('\n✅ All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

testAPI();
