const NGO = require('../models/ngos');
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const fs = require('fs')
const path = require('path')

// @desc    GET ALL NGOs
// @route   GET /api/v1/ngo
// @access  Public
exports.getNGOs = asyncHandler(async (req,res,next) => {
        const ngo = await NGO.find();

        var jsonData = ngo;
        // var jsonObj = JSON.parse(jsonData)
        // console.log(jsonObj)
        var jsonContent = JSON.stringify(jsonData);
        console.log(jsonContent)
        fs.writeFile(path.join(__dirname, '../_data/ngos.json'), jsonContent, 'utf8', function (err){
            if(err) throw err.message;
            console.log("File saved..")
        })

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

        // const filePath = __dirname + '/_data/ngos.json'

        // var writer = fs.createWriteStream(filePath);

        res.status(201).json({
            status: true,
            data: ngo
        })

        // writer.write(ngo);
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