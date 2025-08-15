import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import  User  from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse}from "../utils/ApiResponse.js"

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
    $or: [{username}, {email}]
  })

  if(existedUser){
    throw new ApiError(409, "user with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  const coverImageLocalPath =req.files?.coverImage[0]?.path;

  if(!avatarLocalPath){
     throw ApiError(400, "avatar file required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  const coverimg = await uploadOnCloudinary(coverImageLocalPath);

  if(!avatar){
       throw ApiError(400, "avatar file required")
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
     coverImage: coverimg.url || " ",
     email,
     password,
     username: username.toLowerCase()
  })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if(!createdUser){
      throw new ApiError(500, "something went wrong while registering the use")
   }
  
    return res.status(200).json(
       new ApiResponse(200, createdUser, "user registered successfully")
    )

});

export { registerUser };
