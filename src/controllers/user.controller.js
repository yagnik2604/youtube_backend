import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { getRounds } from "bcrypt";
import {v2 as cloudinary} from 'cloudinary'

const generateAccessAndRefreshTokens = async(userId)=>{
     
    try{
      
      const user = await User.findById(userId)
      
      const accessToken = await user.generateAccessToken()
      const  refreshToken = await user.generateRefreshToken()

      user.refreshToken = refreshToken;
     await user.save({validateBeforeSave: true})
     
     return {accessToken, refreshToken}

    }catch(error){
     throw new ApiError(500, "something went wrong while generating refresh and access tokens")
    }
}


const registerUser = asyncHandler(async (req, res) => {
  // --------algorithm for registeruser-------------

  // get user detail from frontend
  //validation
  //check if user already exixst
  //check for images, avtar
  // upload them to cludnary
  // create user object - create entry in db
  //remove password and refresh token field from response
  // return response

  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "user with email or username already exists");
  }


  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // if(!avatar){
  //      throw new ApiError(400, "avatar file required")
  // }


  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverimg = null;
  if (coverImageLocalPath) {
     coverimg = await uploadOnCloudinary(coverImageLocalPath);
  }

  console.log("avatar:", avatar);
  console.log("coverimg:", coverimg);

  const user = await User.create({
    fullName,
    avatar:{ 
       avatar_url : avatar.url,
       avatarPublic_id: avatar.public_id
    },
    coverImage: {
       coverImage_url: avatar.url,
       coverImagePublic_id: avatar.public_id
    },
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -avatar.avatarPublic_id -coverImage.coverImagePublic_id"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the use");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});


const loginUser = asyncHandler(async(req, res)=>{

  const{username, email, password} = req.body;

  if(!username && !email){
     throw new ApiError(400, "username or email is required")
  }

const user= await User.findOne({
  $or: [{username}, {email}]
})

if(!user){
   throw new ApiError(404, "user does not exist")
}

const isPasswordValid = await user.isPasswordCorrect(password);

if(!isPasswordValid){
  throw new ApiError(401, "invalid user credentials")
}

const {accessToken, refreshToken}= await generateAccessAndRefreshTokens(user._id)

const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

const option={
   httpOnly: true,
   secure: true
}

return res.status(200)
.cookie("accessToken", accessToken, option)
.cookie("refreshToken", refreshToken, option)
.json( 
   new ApiResponse(
    200,
    {
      user: loggedInUser, accessToken, refreshToken
    },
    "user logged in successfully"
   )
)

})


const logoutUser = asyncHandler(async(req, res)=>{
   
await  User.findByIdAndUpdate(
     req.user._id,
     {
        $set:{
                refreshToken: undefined
             }
     },
     {
      new: true
     }
  )

  const option={
   httpOnly: true,
   secure: true
}

return res.status(200)
.clearCookie("accessToken",option)
.clearCookie("refreshToken",option)
.json(
   new ApiResponse(
    200,
    {},
    "user logged out"
   )
)

})

const refreshAccessToken = asyncHandler(async(req, res)=>{
     
  const incominRefreshToken = req.cookie.refreshToken || req.body.refreshToken

  if(! incominRefreshToken){
     throw new ApiError(401, "unauthorized request")
  }

   try{
        
    const decodedToken = jwt.verify(incominRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
    const user = await User.findById(decodedToken?._id);

    if(!user){
       throw new ApiError(401, "invalid refesh torkn")
    }

    if(incominRefreshToken !== user.refreshToken){
          throw new ApiError(401, "refresh token expired or used")
    }

    const option = {
       httpOnly: true,
       secure: true
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
    return res.status(200)
               .cookie("accessToken", accessToken, option)
               .cookie("refreshToken", newRefreshTokenefreshToken, option)
               .json(
                 new ApiResponse(
                  200,
                  {accessToken, refreshToken: newRefreshToken},
                  "access token refreshed"
                 )
               )

   }catch(error){
     throw new ApiError(401, error?.message || "invalid refresh token")
   }
})


const changeCurrentPassword = asyncHandler(async(req, res)=>{
      const {oldPassword, newPassword} = req.body

      const user = await User.findById(req.user._id)
      const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
      
      if(!isPasswordCorrect){
         throw new ApiError(400, "invalid old password")
      }

      user.password = newPassword
      await user.save({validateBeforeSave: false})

      return res.status(200)
                 .json(new ApiResponse(
                  200,
                  {},
                  "password changed successfully"
                 ))
})


const getCurrentUser = asyncHandler(async(req, res)=>{
    return res.status(200)
              .json(new ApiResponse(
                200,
                req.user,
                "user fetch successfully"
              ))
})


const updateAccountDetaile = asyncHandler(async(req, res)=>{
    
  const {fullName, email, username} = req.body
  
  if(!username || !fullName || !email){
     throw new ApiError(400, "all field are require")
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
        $set:{
          fullName: fullName,
          username: username,
           email: email
        }
    },
    {new: true}
  ).select("-password")

 return res.status(200)
            .json(new ApiResponse(
              200,
              user,
              "account detailed updated successfully"
            ))

});

const updateAvatar = asyncHandler(async(req, res)=>{
    
     console.log("Uploaded file:", req.file);
     
    const avatarLocalPaath = req.file?.path

    if(!avatarLocalPaath){
       throw new ApiError(400, "avatar file is mising")
    }
    
    // upload new image to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPaath)
   
    if(!avatar.url){
      throw new ApiError(400, "error while uploading avatar to cloudinery")
    }
    
    const user = await User.findById(req.user._id)
    
    //delete old images if exist
    if(user.avatar?.avatarPublic_id){
        await cloudinary.uploader.destroy(user.avatar.avatarPublic_id);
    }

    //update avatar field

    // const updatedUser = await User.findByIdAndUpdate(
    //    req.user._id,
    //    {
    //          $set: {
    //            avatar: {
    //               avatar_url: avatar.url,
    //               avatarPublic_id: avatar.public_id
    //            }
    //          }
    //    },
    //    {new: true}
    // ).select("-password")


    //update avatar field

    user.avatar = {
       avatar_url: avatar.url,
       avatarPublic_id: avatar.public_id
    }
    await user.save({validateBeforeSave: false})
 
    const updatedUser = await User.findById(user._id).select(
       " -password -refreshToken -avatar.avatarPublic_id -coverImage.coverImagePublic_id"
    );

    return res.status(200)
               .json(new ApiResponse(
                200,
                updatedUser,
                "avatar image updated successfully"
               ))

})


const getUserChannelProfile = asyncHandler(async(req, res)=>{
    
    const {username} = req.params
    if(!username?.trim()){
       throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
          {
            $match:{
               username: username?.toLowerCase()
            }
          },
          {
            $lookup:{
               from:"subscriptions",
               localField: "_id",
               foreignField:"channel",
               as: "subscribers"
            }
          },
          {
             $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField:"subscriber",
                as: "subscribedTo"
             }
          },{
             $addFields: {
                subscribersCount: {
                   $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                   $size: "$subscribedTo"
                }
             }
          },
          {
             $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                 channelsSubscribedToCount:1,
                 avatar: 1,
                coverImage: 1,
                email: 1

             }
          }

    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exists")
    }

    return res.status(200)
              .json(new ApiResponse(
                200,
                channel[0],
                "user fetched successfully"
              ))

})

export { 
  registerUser , 
  loginUser, 
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetaile,
  updateAvatar,
  getUserChannelProfile
};
