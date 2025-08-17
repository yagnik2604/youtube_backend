import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

   // normlize window paths
    const normalizedPath = path.resolve(localFilePath).replace(/\\/g, "/");
       console.log("🚀 Uploading file:", normalizedPath);

    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(normalizedPath, {
      resource_type: "auto",
    });
   
    // Cleanup local file after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    // file has been uploaded successfull
    console.log("file is uploadded on cloudinary", response.url);
   
    return response;
  
  
  } catch (error) {
      console.error("❌ Cloudinary upload error:", error.message);
        
      try{
         //remove the locally saved temporary file as the upload operation falied
          if(fs.existsSync(localFilePath)){
             fs.unlinkSync(localFilePath);
          }
      }catch(unlinkErr){
               console.error("⚠️ Failed to delete temp file:", unlinkErr.message);
      }
    
   
    return null;
  }
};

export { uploadOnCloudinary };
