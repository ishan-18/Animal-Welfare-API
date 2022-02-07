const User = require('../models/user');
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const fs = require('fs')
const path = require('path')
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')

// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req,res,next) => {
    const {name,email,password,role} = req.body;

    const user = await User.create({
        name,
        email,
        password,
        role
    });

    sendTokenResponse(user, 200, res)

})

// @desc    Login User
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req,res,next) => {
    const {email,password} = req.body;

    if(!email || !password) {
        return next(new ErrorResponse('Please Enter an email and password', 400))
    }

    const user = await User.findOne({email}).select('+password')
    if(!user){
        return next(new ErrorResponse('Invalid Credentials', 401))
    }

    const checkPassword = await user.matchPassword(password)
    if(!checkPassword){
        return next(new ErrorResponse('Invalid Credentials', 401))
    }

    sendTokenResponse(user, 200, res)

})

// @desc    GET Current Login User
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req,res,next)=>{
    const user = await User.findById(req.user.id)
    res.status(200).json({
        status: true,
        data: user
    })
})

// @desc    POST Forgot Password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req,res,next)=>{
    const user = await User.findOne({email: req.body.email})

    if(!user){
        return next(new ErrorResponse(`There is no user with that email ${req.body.email}`, 404))
    }

    //Get resetToken
    const resetToken = user.getResetPasswordToken()

    await user.save({validateBeforeSave: false})

    //Create resetUrl 
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `You are recieving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token',
            message: message
        })

        res.status(200).json({success: true, data: 'Email sent'})

    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordexpire = undefined;

        await user.save({validateBeforeSave: false})

        return next(new ErrorResponse(`Email Could not be sent`, 500))
    }
})

// @desc    Reset Password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req,res,next)=>{
    //Get HashedToken
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex')
    
    const user = await User.findOne({ 
        resetPasswordToken,
        resetPasswordexpire: { $gt: Date.now() }
    })

    if(!user){
        return next(new ErrorResponse('Invalid Token', 400))
    }

    //Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined
    user.resetPasswordexpire = undefined

    await user.save()
    
    sendTokenResponse(user, 200, res)

})



//Get token from model, create cookie and send res
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken()

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if(process.env.NODE_ENV === 'production'){
        options.secure = true;
    }

    res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
        success: true,
        token
    })
}

// @desc    Update User Details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req,res,next)=>{
    const fieldstoUpdate ={
        name: req.body.name,
        email: req.body.email
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldstoUpdate, {
        new: true,
        runValidators: true
    })
    
    res.status(200).json({
        status: true,
        data: user
    })
})

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req,res,next)=>{

    const user = await User.findById(req.user.id).select('+password')
    
    if(!(await user.matchPassword(req.body.currentPassword))){
        return next(new ErrorResponse(`Password is incorrect`, 401));
    }

    user.password = req.body.newPassword
    await user.save()

    sendTokenResponse(user, 200, res)
})
