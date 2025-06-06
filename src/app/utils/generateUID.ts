import User from '../modules/user/user.model';

async function generateUID() {
  try {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    let newUserId = '';

    // Find the most recent non-deleted and non-blocked user
    const latestUser = await User.findLastUser();

    if (latestUser && latestUser.uid) {
      // Extract the last number from the userId and increment it
      const lastNumber = parseInt(latestUser.uid.split('-')[1]);
      // console.log({ lastNumber });
      const newNumber = (lastNumber + 1).toString().padStart(5, '0');
      newUserId = newNumber;
    } else {
      // If no valid users found, start from '00001'
      newUserId = '00001';
    }

    const yearLastDigits = year.slice(0, 2);

    // Generate the custom ID
    const customID = `SM-${yearLastDigits + newUserId}`;

    console.log(customID, "customID")
    return customID;
  } catch (err) {
    console.error('Error generating custom ID:', err);
    throw new Error('Failed to generate custom ID');
  }
}

export default generateUID;
