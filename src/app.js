const express = require("express");
const app = express();
const connectDB = require("./Config/database");
const cookieParser = require("cookie-parser");
require('@dotenvx/dotenvx').config()
const authRoute = require("./routes/authRoute");
const profileRoute = require("./routes/profileRoute");
const requestRoute = require("./routes/requestRoute");
const userRoute = require("./routes/userRoute");
const cors = require("cors");
const http = require("http");
const initializeSocket = require("./utils/socket");
const chatRouter = require("./routes/chat");




app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/",authRoute);
app.use("/",profileRoute);
app.use("/",requestRoute);
app.use("/",userRoute);
app.use("/",chatRouter)

const server = http.createServer(app);
initializeSocket(server)

connectDB().then(()=>{
    server.listen( process.env.PORT,()=>{
    })

}).catch((err)=>{
    console.error("Can't connect to Database");
})