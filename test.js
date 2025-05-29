import twilio from 'twilio';

const accountSid = 'ACcac6178ad30ea96b42d641a0fd122be3';
const authToken = 'ef2b15f1e781951ae4e1b971cdadbc6f';
const client = twilio(accountSid, authToken);

const sendMessage = async () => {
  const message = await client.messages.create({
    from: '+19787231530',
    to: '+96599551188',
    body: `Hi Alajmi,
    hopefully you are doing well,
    Im Mahin, Developer in your school management app`,
  });

  console.log(message);
};

sendMessage();
