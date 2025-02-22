const authUser = (req,res,next)=>{
    console.log("Checking");
    const token = "xyz1"
    const isAdmin = token === "xyz";
    if(!isAdmin){
        res.status(401).send("Unauthorized!");
    } 
    else{
        next();
    }
}
module.exports = {
    authUser,
}