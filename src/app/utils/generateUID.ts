import User from '../modules/user/user.model';

async function generateUID(payload: { className: string; section: string }) {
  try {
    const className = payload?.className;
    const section = payload?.section;

    let newUserId = '';
    let customID = '';
    let isUnique = false;

    while (!isUnique) {
      // Get the latest user for this class + section
      const latestUser = await User.findLastUser(className, section);

      if (latestUser?.uid) {
        const lastUid = latestUser.uid.split('-')[1]; // e.g. "00003"
        const lastNumber = parseInt(lastUid, 10);
        const newNumber = (lastNumber + 1).toString().padStart(5, '0');
        newUserId = newNumber;
      } else {
        newUserId = '00001';
      }

      // Generate full UID
      customID = `${className}${section}-${newUserId}`;

      console.log(customID, 'custome id');
      // Check if this UID already exists
      const existingUser = await User.findOne({ uid: customID }).lean();

      if (!existingUser) {
        isUnique = true;
      } else {
        // If it exists, try next number
        const retryNumber = parseInt(newUserId, 10) + 1;
        newUserId = retryNumber.toString().padStart(5, '0');
      }
    }

    return customID;
  } catch (err) {
    console.error('Error generating custom ID:', err);
    throw new Error('Failed to generate custom ID');
  }
}

export default generateUID;
