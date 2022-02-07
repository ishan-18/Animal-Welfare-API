const Review = require('../models/review');
const NGO = require('../models/ngos')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const fs = require('fs')
const path = require('path')

// @desc    GET ALL reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/ngo/:ngoId/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req,res,next)=>{
   if(req.params.ngoId){
       const reviews = await Review.find({ngo: req.params.ngoId})
   
        return res.status(200).json({
            status: true,
            count: reviews.length,
            data: reviews
        })
    }else{
        let query;

        console.log(req.params)

        const reqQuery = {...req.query} 

        const removeFields = ['select','sort', 'page', 'limit'];
        removeFields.forEach(param => delete reqQuery[param]);


        let queryStr = JSON.stringify(reqQuery);

        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)
        query = Review.find(JSON.parse(queryStr)).populate('ngo', 'name description')

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
        const total = await Review.countDocuments();

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

        const review = await query;

        res.status(200).json({
            status: true,
            count: review.length,
            pagination,
            data: review
        })
    }
})

// @desc    GET single review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req,res,next)=>{
    const review = await Review.findById(req.params.id).populate({
        path: 'ngo',
        select: 'name description'
    });

    if(!review){
        return next(new ErrorResponse(`No review found with the id of id ${req.params.id}`, 400));
    }

    res.status(200).json({
        success: true,
        data: review
    })
})

// @desc    Add review
// @route   POST /api/v1/ngo/:ngoId/reviews
// @access  Private
exports.addReview = asyncHandler(async (req,res,next)=>{
    req.body.ngo = req.params.ngoId
    req.body.user = req.user.id

    const ngo = await NGO.findById(req.params.ngoId)

    if(!ngo){
        return next(new ErrorResponse(`No ngo found with the id of ${req.params.ngoId}, 404`))
    }

    const review = await Review.create(req.body);

    res.status(201).json({
        success: true,
        data: review
    })
})

// @desc    Update review
// @route   POST /api/v1/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req,res,next)=>{
    let review = await Review.findById(req.params.id)

    if(!review){
        return next(new ErrorResponse(`No review found with the id of ${req.params.ngoId}`, 404))
    }

    //Make sure review belongs to user or user is admin
    if(review.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(`Not Authorize to update this review`, 401))
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        success: true,
        data: review
    })
})

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req,res,next)=>{
    const review = await Review.findById(req.params.id)

    if(!review){
        return next(new ErrorResponse(`No review found with the id of ${req.params.ngoId}`, 404))
    }

    //Make sure review belongs to user or user is admin
    if(review.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(`Not Authorize to update this review`, 401))
    }

    await Review.findByIdAndDelete(req.params.id)

    res.status(200).json({
        success: true,
        data: {}
    })
})