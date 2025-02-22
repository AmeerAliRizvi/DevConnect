const express = require("express");

const app = express();
const connectDB = require("./Config/database");
const User = require("./models/user");

app.post("/signup", async (req,res)=>{

    const user = new User(
        {
            firstName: "Ameer",
            lastName: "Ali Rizvi",
            emailId: "ameer@gmail.com",
            password: "123abc",
            age: "19",
            gender : "Male"
        }
    )
    try{
        await user.save()
        res.send('User Saved!');
    }
    catch(err){
        res.status(400).send("Error " + err.message)
    }
    
})


connectDB().then(()=>{
    console.log("Connected to the Database Succesfully!");
    app.listen(3000,()=>{
        console.log("Running on Port 3000");
    })

}).catch((err)=>{
    console.error("Can't connect to Database");
})
