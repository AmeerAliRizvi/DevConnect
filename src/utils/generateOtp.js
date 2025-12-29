const generateOtp = (length = 4) => {

    let otp = "";

    for(i = 0; i< length; i++){
        otp += Math.floor(Math.random() * 10);
    }
    
    return otp;
};

module.exports = generateOtp;

