const jwt=require('jsonwebtoken');
const User=require('../models/User');
async function authenticate(req,res,next){
  try{
    const header=req.headers.authorization||''; const token=header.startsWith('Bearer ')?header.slice(7):null;
    if(!token) return res.status(401).json({message:'Authentication required'});
    const payload=jwt.verify(token,process.env.JWT_SECRET);
    const user=await User.findById(payload.userId).select('_id email role tenantId isActive');
    if(!user || !user.isActive) return res.status(401).json({message:'Invalid or inactive account'});
    if(user.role!==payload.role) return res.status(401).json({message:'Invalid token'});
    req.user={userId:user._id.toString(),email:user.email,role:user.role,tenantId:user.tenantId?user.tenantId.toString():null};
    next();
  }catch(e){return res.status(401).json({message:'Invalid or expired token'});}
}
function requireRole(...roles){return (req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({message:'Forbidden'});}
module.exports={authenticate,requireRole};
