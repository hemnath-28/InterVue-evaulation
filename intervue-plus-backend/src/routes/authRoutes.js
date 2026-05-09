const express=require('express')
const UserRoute=express.Router()


const {registerUser,loginUser}=require("./controllers/authController")



UserRoute.post("/login",loginUser)
UserRoute.post("/SignUp",registerUser)

module.exports=UserRoute