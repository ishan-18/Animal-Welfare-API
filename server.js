const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db')
const colors = require('colors');
const errorHandler = require('./middleware/error');

dotenv.config({path: './config/config.env'});

connectDB();

const app = express();
app.use(express.json())

if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// NGO Routes
app.use('/api/v1/ngo', require('./routes/ngos'))

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, ()=>{
    console.log(`Server Listening in ${process.env.NODE_ENV} on port ${process.env.PORT} 🚀`.yellow.bold)
})


// Handle Unhandled rejections
process.on('unhandledRejection', (err,promise)=>{
    console.log(`Error ${err.message}`.red.bold)

    server.close(() => process.exit(1));
})

