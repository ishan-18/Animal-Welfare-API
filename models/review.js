const mongoose = require('mongoose')
const NGO = require('./ngos')

const ReviewSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, "Please add a title for the review"],
        maxLength: 100 
    },
    text: {
        type: String,
        required: [true, 'Please add a review'],
    },
    overall: {
        type: Number,
        min: 1,
        max: 10,
        required: [true, 'Please tell us how this NGO is by giving them rating between 1 - 10']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    ngo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NGO'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
},{
    strict: false,
})

ReviewSchema.index({ngo: 1, user: 1}, {unique: true})

// Static method to get avg of course tuitions
ReviewSchema.statics.getAverageRating = async function(ngoId) {
    const obj = await this.aggregate([
      {
        $match: { ngo: ngoId }
      },
      {
        $group: {
          _id: '$ngo',
          averageRating: { $avg: '$overall' }
        }
      }
    ]);
  
    try {
        await this.model("NGO").findByIdAndUpdate(ngoId, {
          averageRating: obj[0].averageRating
        });
    } catch (err) {
      console.error(err);
    }
  };
  
  // Call getAverageCost after save
  ReviewSchema.post('save', async function() {
    await this.constructor.getAverageRating(this.ngo);
  });
  
  // Call getAverageCost after remove
  ReviewSchema.post('remove', async function () {
    await this.constructor.getAverageCost(this.ngo);
  });

module.exports = mongoose.model('Review', ReviewSchema)