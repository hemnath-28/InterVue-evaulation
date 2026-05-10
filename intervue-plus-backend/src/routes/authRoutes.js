const express=require('express')
const UserRoute=express.Router()
const protect=require('../middleware/Authmiddleware')

const {registerUser,loginUser,getProfile}=require("../controllers/authController")


// /api/auth/login


UserRoute.post("/login",loginUser)
// /api/auth/signup
UserRoute.post("/signUp",registerUser)

// /api/auth.profile --jwt token middleware verification

UserRoute.post("/profile",protect,getProfile)

module.exports=UserRoute
