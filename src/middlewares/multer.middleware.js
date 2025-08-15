
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
      // here we give better fileNames in future  
    cb(null, file.originalname)
  }
})

const upload = multer({ storage: storage })
export {upload}