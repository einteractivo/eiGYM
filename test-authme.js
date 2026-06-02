process.env.JWT_SECRET = 'eigym_secret_key_2025';
const jwt = require('jsonwebtoken');
const http = require('http');

// Test with user 11 (ADMIN of gym 6 - Elite fitness)
const token = jwt.sign(
  { userId: 11, role: 'ADMIN', gymId: 6 },
  'eigym_secret_key_2025',
  { expiresIn: '1h' }
);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/me',
  method: 'GET',
  headers: { 'Authorization': 'Bearer ' + token }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data.substring(0, 300));
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.end();
