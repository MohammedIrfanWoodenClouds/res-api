const mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
  email:{type:String,required:true,unique:true,lowercase:true,trim:true}, passwordHash:{type:String,required:true},
  role:{type:String,enum:['SUPER_ADMIN','RESTAURANT'],required:true}, tenantId:{type:mongoose.Schema.Types.ObjectId,ref:'Restaurant',default:null},
  isActive:{type:Boolean,default:true}
},{timestamps:true});
module.exports=mongoose.model('User',userSchema);
