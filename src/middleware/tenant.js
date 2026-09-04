function requireTenant(req,res,next){
  if(req.user?.role!=='RESTAURANT' || !req.user.tenantId) return res.status(403).json({message:'Restaurant tenant required'});
  next();
}
module.exports={requireTenant};
