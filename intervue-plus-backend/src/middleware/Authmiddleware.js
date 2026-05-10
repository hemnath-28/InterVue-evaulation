const jwt=require('jsonwebtoken')
const User=require('./models/User')
require('dotenv').config()

const protect=async (req,res,next)=>{
    try{
        let token;

        if (req.headers.authorization && 
            req.headers.authoriation.startsWith("Bearer")   
        ){
            bearertoken=req.headers.authoriation.split(" ")[1]
            const decoded=jwt.verify(bearertokentoken,process.env.JWT_SECRET)

            req.user=User.findById(decoded.id).select("-password")

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