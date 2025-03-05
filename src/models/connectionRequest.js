const moongoose = require("mongoose");

const connectionRequestSchema = new moongoose.Schema({

    fromUserId:{
        type: moongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    toUserId:{
        type: moongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status:{
        type: String,
        enum:{
            values: ["ignored","interested","accepted","rejected"],
            message: `{VALUE} is incorrect status type`,
            required: true,
        }
    },
},
{
    timestamps: true,
}
);

connectionRequestSchema.index({fromUserId: 1, toUserId: 1})

connectionRequestSchema.pre("save", function (){
    const connectionRequest = this;
    if(connectionRequest.fromUserId.equals(connectionRequest.toUserId)){
        throw new Error("Cannot send request to yourself!");
    }
})

const ConnectionRequest = new moongoose.model("ConnectionRequest", connectionRequestSchema);
module.exports = ConnectionRequest;