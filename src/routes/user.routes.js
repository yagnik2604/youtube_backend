import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    updateAvatar,
    updateCoverImages
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser);

router.route("/login").post(loginUser)

// -----------secured routes--------------------------//

router.route("/logout").post( verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)    

   //--update avatar route
router.route("/update-avatar").post(
verifyJWT,
upload.single("avatar"),
  updateAvatar);

  //--update coverImage route  
router.route("/update-coverImage").post(
    verifyJWT,
    upload.single("coverImage"),
    updateCoverImages)    

export default router