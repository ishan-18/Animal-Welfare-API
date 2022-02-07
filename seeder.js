const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

dotenv.config({path: './config/config.env'});

const NGO = require('./models/ngos')
const Animal = require('./models/animals')
const User = require('./models/user')
const Review = require('./models/review')

mongoose.connect(process.env.MONGO_URI)

const ngo = JSON.parse(fs.readFileSync(`${__dirname}/_data/ngos.json`, 'utf-8'))
const animals = JSON.parse(fs.readFileSync(`${__dirname}/_data/animals.json`, 'utf-8'))
const user = JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8'))
const review = JSON.parse(fs.readFileSync(`${__dirname}/_data/reviews.json`, 'utf-8'))

//Import in db
const importData = async () => {
    try {
        await NGO.create(ngo);
        await Animal.create(animals)
        await User.create(user)
        await Review.create(review)

        console.log("Data Imported...".green.inverse);
        process.exit();
    } catch (err) {
        console.log(err.message);
    }
}


//Delete the data 
const destroyData = async () => {
    try {
        await NGO.deleteMany();
        await Animal.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();

        console.log("Data Destroyed...".red.inverse);
        process.exit();
    } catch (err) {
        console.log(err.message);
    }
}

if(process.argv[2] === '-i'){
    importData();
}else if(process.argv[2] === '-d'){
    destroyData();
}