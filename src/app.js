import cookieParser from "cookie-parser";
import express from "express"


const app = express();



app.use(cors({
    origin: Process.env.CORS_ORIGIN,
    Credential: true
}))
app.use(express.json({ limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser());


export { app }