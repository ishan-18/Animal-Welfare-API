const NGO = require('../models/ngos');
const Animal = require('../models/animals');
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const fs = require('fs')
const path = require('path')
const geocoder = require('../utils/geocoder')

// @desc    GET ALL NGOs
// @route   GET /api/v1/ngo
// @access  Public
exports.getNGOs = asyncHandler(async (req,res,next) => {
        
        let query;

        console.log(req.params)

        const reqQuery = {...req.query} 

        const removeFields = ['select','sort', 'page', 'limit'];
        removeFields.forEach(param => delete reqQuery[param]);


        let queryStr = JSON.stringify(reqQuery);

        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)
        query = NGO.find(JSON.parse(queryStr)).populate('animals', '_id animal_species')

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
        const total = await NGO.countDocuments();

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

        const ngo = await query;

        
        var jsonData = ngo;
        // var jsonObj = JSON.parse(jsonData)
        // console.log(jsonObj)
        var jsonContent = JSON.stringify(jsonData);
        fs.writeFile(path.join(__dirname, '../_data/ngos.json'), jsonContent, 'utf8', function (err){
            if(err) throw err.message;
            console.log("File saved..")
        })

        if(ngo){
            res.status(200).json({
                status: true,
                count: ngo.length,
                pagination,
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
            return next(new ErrorResponse(`NGO not found with id of ${req.params.id}`, 404));
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
    //Add user to req.body
    req.body.user = req.user.id    
    
    //Check for ngouser
    const publishedNgo = await NGO.findOne({ user: req.user.id })

    if(publishedNgo && req.user.role !== 'admin' ){
        return next(new ErrorResponse(`The user with this ID ${req.user.id} has already published a NGO`, 400));
    }



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
        let ngo = await NGO.findById(req.params.id)

        if(!ngo){
            return next(new ErrorResponse(`NGO not found with id of ${req.params.id}`, 401));
        }

        if(ngo.user.toString() !== req.user.id &&  req.user.role !== 'admin'){
            return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this ngo`, 401))
        }

        ngo = await NGO.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })

        res.status(200).json({
            status: true,
            data: ngo
        })
})

// @desc    DELETE single NGO
// @route   DELETE /api/v1/ngo/
// @access  Private
exports.deleteNGO = asyncHandler(async (req,res,next) => {
        const ngo = await NGO.findById(req.params.id)

        if(!ngo){
            return next(new ErrorResponse(`NGO not found with id of ${req.params.id}`, 401));
        }

        if(ngo.user.toString() !== req.user.id &&  req.user.role !== 'admin'){
            return next(new ErrorResponse(`User ${req.params.id} is not authorized to delet this ngo`, 401))
        }

        ngo.remove();

        res.status(200).json({
            status: true,
            msg: "Deleted Successfully"
        })
});

// @desc    GET NGO within a radius
// @route   GET /api/v1/ngo/radius/:zipcode/:distance
// @access  Private
exports.getNGOsInRadius = asyncHandler(async (req,res,next) => {
    const {zipcode, distance} = req.params

    //Get lat/lang from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    //Calc radius using radius calculation
    //Divide dist by Earth's radius 
    //Earth's Radius = 3963 miles/6378kms
    const radius = distance /3693;

    const ngo = await NGO.find({
        location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    })

    res.status(200).json({
        success: true,
        count: ngo.length,
        data: ngo
    })

});

// @desc    Upload Photo for ngo
// @route   PUT /api/v1/ngo/:id/photo
// @access  Private
exports.ngoPhotoUpload = asyncHandler(async (req,res,next) => {
    const ngo = await NGO.findById(req.params.id)

    if(!ngo){
        return next(new ErrorResponse(`Ngo not found with id of ${req.params.id}`, 404));
    }

    if(ngo.user.toString() !== req.user.id &&  req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this ngo`, 401))
    }

    if(!req.files){
        return next(new ErrorResponse(`Please Upload a photo of NGO`, 400));
    }

    console.log(req.files.file)

    const file = req.files.file

    //Check if image is photo already
    if(!file.mimetype.startsWith('image')){
        return next(new ErrorResponse(`Please Upload an valid Image File`, 400));
    }

    //Check file size
    if(file.size > process.env.MAX_FILE_UPLOAD){
        return next(new ErrorResponse(`Please Upload an image size less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }

    //Create a custom file Name
    file.name = `photo_${ngo._id}${path.parse(file.name).ext}`
    
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if(err) throw err.message
    });

    await NGO.findByIdAndUpdate(req.params.id, {photo: file.name},{
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: file.name
    })

});