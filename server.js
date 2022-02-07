const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db')
const colors = require('colors');
const errorHandler = require('./middleware/error');
const fileupload = require('express-fileupload');
const path = require('path');
const cookieParser = require('cookie-parser');

dotenv.config({path: './config/config.env'});

connectDB();

const app = express();
app.use(express.json())
app.use(cookieParser())

if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

app.use(fileupload())


//Static upload 
app.use(express.static(path.join(__dirname, 'public')))

// NGO Routes
app.use('/api/v1/ngo', require('./routes/ngos'))
app.use('/api/v1/animal', require('./routes/animals'))
app.use('/api/v1/auth', require('./routes/auth'))
app.use('/api/v1/users', require('./routes/user'))
app.use('/api/v1/reviews', require('./routes/review'))

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

