const User = require('../models/user');
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const fs = require('fs')
const path = require('path')

// @desc    GET All Users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req,res,next) => {
    let query;

        console.log(req.params)

        const reqQuery = {...req.query} 

        const removeFields = ['select','sort', 'page', 'limit'];
        removeFields.forEach(param => delete reqQuery[param]);


        let queryStr = JSON.stringify(reqQuery);

        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)
        query = User.find(JSON.parse(queryStr))

        if(req.query.select){
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields)
        }

        if(req.query.sort){
            const sortBy = req.query.sort.split(',').join(' ')
            query = query.sort(sortBy)
        }else{
            query = query.sort('-createdAt');
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit
        const total = await User.countDocuments();

        query = query.skip(startIndex).limit(limit);

        const pagination = {};
        if(endIndex < total){
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if(startIndex > 0){
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        const user = await query;

        var jsonData = user;
        var jsonContent = JSON.stringify(jsonData);
        fs.writeFile(path.join(__dirname, '../_data/users.json'), jsonContent, 'utf8', function (err){
            if(err) throw err.message;
            console.log("File saved..")
        })

        if(user){
            res.status(200).json({
                status: true,
                count: user.length,
                pagination,
                data: user
            })
        }else{
            return res.status(404).json({
                status: false
            })
        }

})

// @desc    GET Single User
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req,res,next) => {
    const user = await User.findById(req.params.id);
    if(user){
        res.status(200).json({
            success: true,
            data: user
        })
    }else{
        return next(new ErrorResponse(`User not found`, 404))
    }
})

// @desc    Create User
// @route   POST /api/v1/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req,res,next) => {
    const user = await User.create(req.body);
    res.status(201).json({
        success: true,
        data: user
    })
})

// @desc    Update User
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req,res,next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    res.status(200).json({
        success: true,
        data: user
    })
})

// @desc    Delete User
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req,res,next) => {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        data: {}
    })
})