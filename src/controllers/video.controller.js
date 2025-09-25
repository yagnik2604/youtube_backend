
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Video } from "../models/video.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { isValidObjectId } from "mongoose";
import {v2 as cloudinary} from "cloudinary"


//--------------- publish video------------------//

// 1.get the video and thumbnail from the request body
// upload video and thumbnail to local storage and get path
// upload video and thumbnail to cloudinary
// create video docmnet in the database
const publishVideo = asyncHandler(async(req, res)=>{
       
     try{

    const {title, description} = req.body

    if([title, description].some((field)=> field?.trim() =="")){
         throw new ApiError(400, "please privide all details")
    }

    const videoLocalPaath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
       
    console.log(videoLocalPaath)
    console.log(thumbnailLocalPath)
     
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
   
    console.log(video)
    console.log(thumbnail)

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


   }catch(error){
       throw new ApiError(400, "error in controller")
   }            

})

//-----------------get a video by id -------------//

const getVideoById = asyncHandler(async(req, res)=>{
        
    try{
        const {videoId} = req.params
        
        if( !isValidObjectId(videoId)){
            throw new ApiError(400, "invalid VideoID")
        }

        const video = await Video.findById(videoId);

        if(!video){
            throw new ApiError(400, "failed to get video")
        }

        return res.status(200)
                  .json(new ApiResponse(200, video, "video"))


    }catch(error){
        throw new ApiError(400, "error in getVideoById controller")
    }
})


//-------------------update video-------------//

const updateVideo = asyncHandler(async(req, res)=>{
    try{
       
    const {videoId} = req.params
    
    if(!isValidObjectId){
        throw new ApiError(400, "invalid videosId")
    }

    const {title, description} = req.body

    if([title, description].some((field)=> field.trim() == "")){
        throw new ApiError(400, "please provide title and description")
    }

    const thumbnailLocalPath = req.file?.path
    if(! thumbnailLocalPath){
        throw new ApiError(400, "thumbnail not fount")
    }

    const cloudinaryThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(! cloudinaryThumbnail){
         throw new ApiError(400, "thumbnail not upload to cludinary")
    }

    const video = await Video.findById(videoId)
    if(!video){
         throw new ApiError(400, "video not found")
    }

    if(video.thumbnail?.thumbnailPublic_url){
        await cloudinary.uploader.destroy(video.thumbnail.thumbnailPublic_url)
    }

    video.title = title
    video.description = description
    video.thumbnail={
        thumbnail_url: cloudinaryThumbnail.url,
        thumbnailPublic_url: cloudinaryThumbnail.public_id
    }
    await video.save()

    // const video = await Video.findByIdAndUpdate(
    //     videoId,
    //     {
    //          $set:{
    //             title : title,
    //             description: description,
    //             thumbnail :{
    //                 thumbnail_url: cloudinaryThumbnail.url,
    //                 thumbnailPublic_url: cloudinaryThumbnail.public_id
    //             }
    //          }
    //     },
    //     {
    //         new: true
    //     }
    // )
  
     return res.status(200)
                .json(200, video, "updated video")

    }catch(error){
         throw new ApiError(400, "error in update video controller")
    }
})

//--------------delete video ----------//
const deleteVideo = asyncHandler(async(req, res)=>{
     
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "invalid videoId")
    }
   
    // find video
    const video = await Video.findById(videoId)
    if(!video){
         throw new ApiError(400, "video not found")
    }
    
    // authorization check
    if(!video.owner.equals(req.user._id)){
          throw new ApiError(400, "you are not authorized to delete this video")
    }
    
    // delete thumbnail from cloudinary
    if(video.thumbnail.thumbnailPublic_url){
        const deleteThumbnail = await cloudinary.uploader.destroy(video.thumbnail.thumbnailPublic_url)
         if(!deleteThumbnail){
             throw new ApiError(400, "thumbnail not deleted from cloudinary")
         }
    }

    // delete video from cloudinary
    if(video.videoFile.videoFilePublic_url){
      const deleteVideo = await cloudinary.uploader.destroy(video.videoFile.videoFilePublic_url)
      if(!deleteVideo){
          throw new ApiError(400, "video not deleted from cloudinary")
      }
    }
     
    // delete document from db
    await video.deleteOne();
     
    // response
    return res.status(200)
               .json(new ApiResponse(200, {}, "video delete successfully"))   

})

export{
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo
}