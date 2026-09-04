const app=require('./app');const connectDB=require('./config/db');const seed=require('./seed/superAdmin');const port=process.env.PORT||5000;
(async()=>{try{await connectDB();await seed();app.listen(port,()=>console.log(`API running on http://localhost:${port}`));}catch(e){console.error(e);process.exit(1);}})();
