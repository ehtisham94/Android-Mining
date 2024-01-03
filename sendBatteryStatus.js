const http = require('http');

const apiUrl = 'https://example.com/api/endpoint'; // Replace with your API endpoint

const dataToSend = JSON.stringify({
  key1: 'value1',
  key2: 'value2',
  // Add more key-value pairs as needed
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Add any additional headers as needed
  },
};

const req = http.request(apiUrl, options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

// Send the POST request with the data
req.write(dataToSend);
req.end();
