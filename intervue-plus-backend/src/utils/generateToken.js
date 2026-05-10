const jwt=require('jsonwebtoken')

const generateToken=(id,name)=>{
    return jwt.sign({id,name},
        createSecretKey,
        {expiresIn:"2h"}
    )
}

module.exports=generateToken