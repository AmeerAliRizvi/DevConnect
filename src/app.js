const express = require("express");
const app = express();
const connectDB = require("./Config/database");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/authRoute");
const profileRoute = require("./routes/profileRoute");
const requestRoute = require("./routes/requestRoute");
const userRoute = require("./routes/userRoute");
const cors = require("cors");

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express. json());
app.use(cookieParser());

app.use("/",authRoute);
app.use("/",profileRoute);
app.use("/",requestRoute);
app.use("/",userRoute);

connectDB().then(()=>{
    console.log("Connected to the Database Succesfully!");
    app.listen( 4000,()=>{
        console.log("Running on Port 4000");
    })

}).catch((err)=>{
    console.error("Can't connect to Database");
})
