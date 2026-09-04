const mongoose = require('mongoose');
const restaurantSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true}, slug:{type:String,required:true,unique:true,lowercase:true,trim:true},
  email:{type:String,trim:true,lowercase:true}, phone:{type:String,trim:true}, address:{type:String,trim:true},
  logo:{type:String,default:''}, isActive:{type:Boolean,default:true}
},{timestamps:true});
module.exports=mongoose.model('Restaurant',restaurantSchema);
