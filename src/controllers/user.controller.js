import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const generateAccessAndRefreshTokens = async(userId)=>{
     
    try{
      
      const user = User.findById(userId)
      
      const accessToken = user.generateAccessToken()
      const  refreshToken = user.generateRefreshToken()

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
    avatar: avatar.url,
    coverImage: coverimg?.url,
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
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

const {accessToken, refreshToken}= generateAccessAndRefreshTokens(user._id)

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

export { registerUser , loginUser, logoutUser};
