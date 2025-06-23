import axios from 'axios';
import https from 'https';
const agent = new https.Agent({ rejectUnauthorized: false });

const sendSMS = async (toPhone, messageText) => {
  const url = 'https://api.kwtsms.com/send/';
  const payload = new URLSearchParams({
    username: 'petroliapp',
    password: 'Likuwt@95189518',
    sender: 'Classaty',
    to: toPhone,
    message: messageText,
  });

  try {
    const response = await axios.post(url, payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: '*/*',
      },
      httpsAgent: agent,
    });

    console.log('Response:', response.data);
  } catch (error) {
    console.error('SMS sending failed:', error.response?.data || error.message);
  }
};

// Test call
sendSMS(
  '+19787231530',
  'Hello! This is a test message from kwtSMS using Node.js',
);
