const userModel = require('../models/user.model');
const userService = require("../services/user.service");
const {validationResult} = require('express-validator');
const blackListTokenModel = require('../models/blacklistToken.model');


// Register
exports.register = async(req, res, next) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array(),});
    }
   

    const {fullname, email, password} = req.body;

    const isUserAlreadyExist = await userModel.findOne({email});

    if(isUserAlreadyExist){
        return res.status(400).json({message: 'User Already Exist'});
    }
    
    const hashedPassword = await userModel.hashPassword(password);

    const user = await userService.createUser({
        firstname: fullname.firstname,
        lastname: fullname.lastname,
        email,
        password: hashedPassword
    });

    const token = user.generateAuthToken();

    res.status(201).json({token, user})
}

// Login
exports.login = async(req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }

    const {email, password} = req.body;
    const user = await userModel.findOne({email}).select('+password');

    if(!user){
        return res.status(401).json({message: 'Invalid Email or Password'});
    }

    const isMatch = await user.comparePassword(password);

    if(!isMatch){
        return res.status(401).json({message: 'Invalid Email or Password'});
    }

    const token = user.generateAuthToken();
    // Production level code
    // res.cookie('token', token, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === 'production',
    //     maxAge:3600000
    // });

    res.cookie('token', token);

    return res.status(200).json({token, user});
}

// Profile
exports.profile = async(req, res) => {

    return res.status(201).json(req.user);

}

// Logout
exports.logout = async(req, res) => {

    res.clearCookie('token');
    const token = req.cookies.token || req.header.authorization.split(' ')[ 1 ];

    await blackListTokenModel.create({token});

    res.status(200).json({message: 'Logged Successfully'});
}