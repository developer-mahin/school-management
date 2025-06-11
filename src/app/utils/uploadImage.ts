// import multer from 'multer';
// import path from 'path';

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/uploads/images/');
//   },
//   filename: function (req, file, cb) {
//     cb(
//       null,
//       file.fieldname + '_' + Date.now() + path.extname(file.originalname),
//     );
//   },
// });

// const upload = multer({ storage: storage });
// export default upload;

import fs from 'fs';
import multer from 'multer';
import path from 'path';

const fileUpload = (fileDirectory: string) => {
  if (!fs.existsSync(fileDirectory)) {
    fs.mkdirSync(fileDirectory, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, fileDirectory);
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + '_' + Date.now() + path.extname(file.originalname),
      );
    },
  });
  const upload = multer({ storage: storage });
  return upload;
};

export default fileUpload;
