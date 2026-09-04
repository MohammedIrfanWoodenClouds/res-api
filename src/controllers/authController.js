const bcrypt=require('bcryptjs'); const jwt=require('jsonwebtoken'); const User=require('../models/User'); const Restaurant=require('../models/Restaurant');
function sign(user){return jwt.sign({userId:user._id.toString(),tenantId:user.tenantId?user.tenantId.toString():null,role:user.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'1d'});}
async function login(req,res){
  const email=String(req.body.email||'').trim().toLowerCase(); const password=String(req.body.password||'');
  if(!email||!password) return res.status(400).json({message:'Email and password are required'});
  const user=await User.findOne({email}); if(!user||!user.isActive||!(await bcrypt.compare(password,user.passwordHash))) return res.status(401).json({message:'Invalid email or password'});
  if(user.role==='RESTAURANT'){const r=await Restaurant.findById(user.tenantId); if(!r||!r.isActive) return res.status(403).json({message:'Restaurant is inactive'});}
  res.json({token:sign(user),user:{id:user._id,email:user.email,role:user.role,tenantId:user.tenantId}});
}
async function me(req,res){res.json({user:req.user});}
module.exports={login,me};
