const express = require("express");

const app = express();
const connectDB = require("./Config/database");
const User = require("./models/user");

app.use(express. json());

app.post("/signup", async (req,res)=>{

    const user = new User(req.body);
    try{
        await user.save()
        res.send('User Saved!');
    }
    catch(err){
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
