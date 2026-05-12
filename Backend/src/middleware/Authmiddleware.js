const jwt=require('jsonwebtoken')
const User=require('../models/User')
require('dotenv').config()

const protect=async (req,res,next)=>{
    try{
        let token;

        if (req.headers.authorization && 
            req.headers.authorization.startsWith("Bearer")   
        ){
            const bearertoken=req.headers.authorization.split(" ")[1]
            const decoded=jwt.verify(bearertoken,process.env.JWT_SECRET)

            req.user=await User.findById(decoded.id).select("-password")

            if (!req.user) {
                return res.status(401).json({
                    message: "User not found"
                })
            }

            next()
        }
        else{
             return res.status(401).json({
                message: "No token provided"
            })
        }
    }
    catch(err){
         return res.status(401).json({
            message: "Invalid token"
        })

    }
    
}

module.exports=protect
