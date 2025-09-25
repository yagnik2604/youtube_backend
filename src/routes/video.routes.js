import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    deleteVideo,
    getVideoById,
    publishVideo, 
    updateVideo

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

router.route("/:videoId").get(verifyJWT, getVideoById)

router.route("/:videoId").patch(
    verifyJWT,
    upload.single("thumbnail"),
    updateVideo)

router.route("/:videoId").delete(verifyJWT, deleteVideo)    
export default router



