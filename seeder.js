const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

dotenv.config({path: './config/config.env'});

const NGO = require('./models/ngos')

mongoose.connect(process.env.MONGO_URI)

const ngo = JSON.parse(fs.readFileSync(`${__dirname}/_data/ngos.json`, 'utf-8'))

//Import in db
const importData = async () => {
    try {
        await NGO.create(ngo)

        console.log("Data Imported...".green.inverse);
        process.exit();
    } catch (err) {
        console.log(err.message);
    }
}


//Delete the data 
const destroyData = async () => {
    try {
        await NGO.deleteMany()

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