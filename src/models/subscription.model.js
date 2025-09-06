
import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new mongoose.Schema({

    // one who is subscribing
    
    subscriber: {
         type: Schema.Types.ObjectId, 
         ref: "User" 
    },

    // one to whom 'subscriber' is subscribing

    channel:{
         type: Schema.Types.ObjectId,
         ref: "User"
    }
}, {timestamps: true})


export const Subscription = mongoose.model("Subscription", subscriptionSchema)