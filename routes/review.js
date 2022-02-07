const router = require('express').Router({mergeParams: true});
const {getReviews, getReview, addReview, updateReview, deleteReview} = require('../controllers/review')
const {protect, authorize} = require('../middleware/auth')

router.route('/')
.get(getReviews)
.post(protect, authorize('user', 'admin'), addReview)

router.route('/:id')
.get(getReview)
.put(protect, authorize('user', 'admin'), updateReview)
.delete(protect, authorize('user', 'admin'), deleteReview)

module.exports = router;

