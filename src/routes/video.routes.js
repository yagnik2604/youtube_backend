import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    publishVideo 

} from "../controllers/video.controller.js";


const router = Router()


// publish videos
router.route('/publish').post(verifyJWT,
    upload.fields([
        {
        name: "videoFile",
        maxCount: 1
        },
        {
         name: "thumbnail",
         maxCount: 1
        }
    ]),
    publishVideo
)

export default router



