import twilio from 'twilio';

const accountSid = 'ACcac6178ad30ea96b42d641a0fd122be3';
const authToken = 'ef2b15f1e781951ae4e1b971cdadbc6f';
const client = twilio(accountSid, authToken);

const sendMessage = async () => {
  const message = await client.messages.create({
    body: 'kire hala',
    from: '+8801785767584',
    to: '+8801798552909',
  });

  return message;
};

sendMessage();
