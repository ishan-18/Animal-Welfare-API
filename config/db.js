const mongoose = require('mongoose');

const connectDB = async () => {
    const conn = await mongoose.connect('mongodb+srv://ishan123:ishan123321@ediproject.kxu4j.mongodb.net/myFirstDatabase?retryWrites=true&w=majority')

    console.log(`MongoDB connected`.cyan.bold.underline)
}

module.exports = connectDB;