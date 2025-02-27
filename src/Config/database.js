const mongoose = require('mongoose')

const connectDB = async()=>{
    await mongoose.connect(
        "mongodb+srv://AmeerAli:ctjOXblDm7uKAcNb@datahub.hgiwk.mongodb.net/?retryWrites=true&w=majority&appName=DataHub/you",
    )
}
module.exports = connectDB;