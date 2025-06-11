import https from 'https';

const sendSMS = () => {
  const options = {
    hostname: 'www.kwtsms.com', // Update with actual hostname if different
    port: 443,
    path: '/API/send/', // SMS sending endpoint (you may need to confirm from kwtSMS documentation)
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  // Update the postData with your actual credentials and message
  const postData =
    'username=petroliapp' +
    '&password=Likuwt@95189518' +
    '&sender=Classaty' + // Sender ID approved by kwtSMS
    '&mobile=+8801342084045' + // e.g., 965XXXXXXXX
    '&message=Your%20message%20here'; // URL-encoded message

  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    res.on('data', (d) => {
      process.stdout.write(d);
    });
  });

  req.on('error', (error) => {
    console.error(error);
  });

  req.write(postData);
  req.end();
};

sendSMS();
