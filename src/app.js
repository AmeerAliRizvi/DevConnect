const express = require("express");
const app = express();
const connectDB = require("./Config/database");
const User = require("./models/user");
const bcrypt = require('bcrypt');

app.use(express. json());

app.post("/signup", async (req,res)=>{

    try{
        const {firstName,lastName,emailId,password,age,gender,Skills} = req.body;
        const passwordHash = await bcrypt.hash(password,10);

        const user = new User({ 
            firstName,
            lastName,
            emailId,
            password: passwordHash,
            age,
            gender,
            Skills,
    });
        await user.save()
        res.send('User Saved!');
    }
    catch(err){
        res.status(400).send("Error " + err.message);
    }
    
})

app.post("/login",async (req,res)=>{
    try{
        const {emailId,password} = req.body;
        const user = await User.findOne({emailId: emailId});
        if(!user){
            throw new Error("Invalid Credentials!");
        }
        const validPassword = await bcrypt.compare(password,user.password);
        if(validPassword){
            res.send("Logged In Successfully!");
        }
        else{
            throw new Error("Password Incorrect");
        }
    }catch(err){
        res.status(400).send("Error " + err.message);
    }
})

app.get("/fetch",async (req,res)=>{

    const email = "ameer@gmail.com";
    try{
        const user = await User.findOne({emailId: email});
        res.send(user);
    } catch(err){
        res.status(404).send("User not found!");
    }
})

app.patch("/update",async (req,res)=>{
    const { userId, ...data } = req.body;
   
    try {
        const allowedFields = ["gender", "age", "Skills"];
        const isAllowed = Object.keys(data).every((k) => allowedFields.includes(k));

        if (!isAllowed) {
            return res.status(400).send({ error: "Invalid fields provided!" });
        }
        
        if (data?.Skills && data.Skills.length > 10) {
            return res.status(400).send({ error: "No more than 10 skills can be added" });
        }

        const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });

        if (!user) {
            return res.status(404).send({ error: "User not found!" });
        }

        res.send({ message: "User updated successfully!", user });
    } catch (err) {
        
        res.status(500).send({ error: err.message });
    }
    
});

connectDB().then(()=>{
    console.log("Connected to the Database Succesfully!");
    app.listen( 4000,()=>{
        console.log("Running on Port 4000");
    })

}).catch((err)=>{
    console.error("Can't connect to Database");
})
