
import { ApiError } from "../utils/ApiError.js"
import {asycHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Video } from "../models/video.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"


//--------------- publish video------------------//

// 1.get the video and thumbnail from the request body
// upload video and thumbnail to local storage and get path
// upload video and thumbnail to cloudinary
// create video docmnet in the database
const publishVideo = asycHandler(async(req, res)=>{
       
    const {title, description} = req.body

    if([title, description].some((field)=> field?.trim() =="")){
         throw new ApiError(400, "please privide all details")
    }

    const videoLocalPaath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
       
     
    if(!videoLocalPaath){
        throw new ApiError(400, "please upload video")
    } 
    const video = await uploadOnCloudinary(videoLocalPaath)
    if(! video){
         throw new ApiError(400, "video uploading failed")
    }


    if(! thumbnailLocalPath){
        throw new ApiError(400, "please upload thumbnail")
    }
    const thumbnail =await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail){
         throw new ApiError(400, "thumbnail uploading failed")
    }
 
    const content = await Video.create({

        title: title,
        description: description,
        videoFile:{
            videoFile_url: video?.url,
            videoFilePublic_url : video.public_id
        },
        thumbnail:{
            thumbnail_url : thumbnail.url,
            thumbnailPublic_url:thumbnail.public_id
        },
        duration: video?.duration,
        isPublished: true,
        owner: req.user?.id
    })

    if(!content){
         throw new ApiError(400, "video upload falied")
    }

    return res.status(200)
               .json(new ApiResponse(
                201,
                content,
                "video uploaded successfully"
               ))

})

export{
    publishVideo
}