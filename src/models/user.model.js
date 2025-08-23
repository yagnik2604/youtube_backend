import mongoose, {Schema} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
         username:{
             type: String,
             require: true,
             unique: true,
             lowercase: true,
             trim: true,
             index: true
         },
         email:{
             type: String,
             require: true,
             unique: true,
             lowercase: true,
             trim: true,
            
         },

        fullName:{
             type: String,
             require: true,
             trim: true,
            
         },

         avatar:{
             type: String, // cloudinary url
             require: true,
         },

          coverImage:{
             type: String, // cloudinary url
         },
         watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
         ],
         password:{
            type: String,
            require: [true, "password is required"]
         },

         refreshToken: {
            type: String,

         } 
         
    },
    {
        timestamps: true
    }
)


//pre midleware (this pre is provided by mongoose) it run before save 
userSchema.pre("save", async function(next){
    
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

// -------------------user define(custom) function ---------------------------
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function(){
   
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRY  
        }

     )
    
}

userSchema.methods.generateRefreshToken = async function(){
    
    return jwt.sign(
        {
            _id: this._id,
           
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY 
        }

     )
}




 const User = mongoose.model("User", userSchema)
 
 export default User 