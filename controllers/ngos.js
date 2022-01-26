const NGO = require('../models/ngos');
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')

// @desc    GET ALL NGOs
// @route   GET /api/v1/ngo
// @access  Public
exports.getNGOs = asyncHandler(async (req,res,next) => {
        const ngo = await NGO.find();
        if(ngo){
            res.status(200).json({
                status: true,
                count: ngo.length,
                data: ngo
            })
        }else{
            return res.status(400).json({
                success: false,
                msg: "Something went wrong"
            })
        }
});

// @desc    GET single NGO
// @route   GET /api/v1/ngo/:id
// @access  Public
exports.getNGO = asyncHandler(async (req,res,next) => {
        const ngo = await NGO.findById(req.params.id);
        
        if(!ngo){
            return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: ngo
        })
});

// @desc    Create new NGOs
// @route   POST /api/v1/ngo/
// @access  Private
exports.createNGO = asyncHandler(async (req,res,next) => {
        const ngo = await NGO.create(req.body);
        
        res.status(201).json({
            status: true,
            data: ngo
        })
});

// @desc    PUT single NGO
// @route   PUT /api/v1/ngo/
// @access  Private
exports.updateNGO = asyncHandler(async (req,res,next) => {
        const ngo = await NGO.findByIdAndUpdate(req.params.id, req.body,{
            new: true,
            runValidators: true
        });

        if(!ngo){
            return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));return res.status(400).json({
                success: false
            })
        }

        res.status(200).json({
            status: true,
            data: ngo
        })
})

// @desc    DELETE single NGO
// @route   DELETE /api/v1/ngo/
// @access  Private
exports.deleteNGO = asyncHandler(async (req,res,next) => {
        const ngo = await NGO.findByIdAndDelete(req.params.id)

        if(!ngo){
            return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            status: true,
            msg: "Deleted Successfully"
        })
});