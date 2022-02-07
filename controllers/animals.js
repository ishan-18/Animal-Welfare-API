const Animal = require('../models/animals');
const NGO = require('../models/ngos')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const fs = require('fs')
const path = require('path')
const geocoder = require('../utils/geocoder')

// @desc    GET ALL Animals
// @route   GET /api/v1/animal
// @route   GET /api/v1/ngo/:ngoId/animals
// @access  Public
exports.getAnimals = asyncHandler(async (req,res,next)=>{
    let query;

        console.log(req.params)

        const reqQuery = {...req.query} 

        const removeFields = ['select','sort', 'page', 'limit'];
        removeFields.forEach(param => delete reqQuery[param]);


        let queryStr = JSON.stringify(reqQuery);

        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)
        query = Animal.find(JSON.parse(queryStr))

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
        const total = await Animal.countDocuments();

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

        const animal = await query;


    
    if(req.params.ngoId){
        const ngo1 = await NGO.findById(req.params.ngoId);

        if (!ngo1)
        return next(
          new ErrorResponse(`NGO not found with ID of ${req.params.ngoId}`, 404)
        );

        query = Animal.find({ngo: req.params.ngoId}).populate('ngo', 'name description')
    }else{
        query = Animal.find().populate('ngo', 'name description')
    }


    var jsonData = animal;
    var jsonContent = JSON.stringify(jsonData);
    fs.writeFile(path.join(__dirname, '../_data/animals.json'), jsonContent, 'utf8', function (err){
        if(err) throw err.message;
        console.log("File saved..")
    })

    if(animal){
        res.status(200).json({
            status: true,
            count: animal.length,
            pagination,
            data: animal
        })
    }else{
        return res.status(404).json({
            status: false
        })
    }
})

// @desc    GET single Animal
// @route   GET /api/v1/animal/:id
// @access  Public
exports.getAnimal = asyncHandler(async (req,res,next) => {
    const animal = await Animal.findById(req.params.id).populate('ngo', 'name description');
    
    if(!animal){
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: animal
    })
});

// @desc    Create new Post for Animal
// @route   POST /api/v1/animal/
// @access  Private
exports.createAnimal = asyncHandler(async (req,res,next) => {
    req.body.user = req.user.id  
    
    const animal = await Animal.create(req.body);

    res.status(201).json({
        status: true,
        data: animal
    })

});

// @desc    PUT single Animal Details
// @route   PUT /api/v1/animal/
// @access  Private
exports.updateAnimal = asyncHandler(async (req,res,next) => {
    let animal = await Animal.findById(req.params.id);

    if(animal.user.toString() !== req.user.id &&  req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this animal details`, 401))
    }

    if(!animal){
        return next(new ErrorResponse(`Animal not found with id of ${req.params.id}`, 404));
    }

    animal = await Animal.findByIdAndUpdate(req.params.id, req.body,{
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: true,
        data: animal
    })
})

// @desc    DELETE single Animal
// @route   DELETE /api/v1/animal/
// @access  Private
exports.deleteAnimal = asyncHandler(async (req,res,next) => {
    const animal = await Animal.findById(req.params.id)

    if(animal.user.toString() !== req.user.id &&  req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this animal details`, 401))
    }

    if(!animal){
        return next(new ErrorResponse(`Animal not found with id of ${req.params.id}`, 404));
    }

    animal.remove();

    res.status(200).json({
        status: true,
        msg: "Deleted Successfully"
    })
});

// @desc    GET Animal within a radius
// @route   GET /api/v1/animal/radius/:zipcode/:distance
// @access  Private
exports.getAnimalsInRadius = asyncHandler(async (req,res,next) => {
    const {zipcode, distance} = req.params

    //Get lat/lang from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    //Calc radius using radius calculation
    //Divide dist by Earth's radius 
    //Earth's Radius = 3963 miles/6378kms
    const radius = distance /3693;

    const animal = await Animal.find({
        location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    })

    res.status(200).json({
        success: true,
        count: animal.length,
        data: animal
    })

});


// @desc    PUT Animal in MGO
// @route   PUT /api/v1/animal/ngo/:ngoid
// @access  Public
exports.getAnimalsRescuedByNGO = asyncHandler(async (req,res,next) => {
    const ngo = await NGO.findById(req.params.ngoid);

    const animal = await Animal.findByIdAndUpdate(req.body.animalid, {
        $push: {ngo: ngo}
    },{
        new: true
    }).populate('ngo', 'name description')

    res.status(200).json({
        success: true,
        data: animal
    })

});

// @desc    Upload Photo for ngo
// @route   PUT /api/v1/ngo/:id/photo
// @access  Private
exports.uploadphotosOfAnimals = asyncHandler(async (req,res,next) => {
    const animal = await Animal.findById(req.params.id)

    if(!animal){
        return next(new ErrorResponse(`Animal not found with id of ${req.params.id}`, 404));
    }

    if(animal.user.toString() !== req.user.id &&  req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this animal details`, 401))
    }

    if(!req.files){
        return next(new ErrorResponse(`Please Upload a photo of Animal`, 400));
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
    file.name = `photo_${animal._id}${path.parse(file.name).ext}`
    
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if(err) throw err.message
    });

    await Animal.findByIdAndUpdate(req.params.id, {photo: file.name},{
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: file.name
    })

});
