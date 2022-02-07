const {getNGOs, getNGO, createNGO, updateNGO, deleteNGO, getNGOsInRadius, ngoPhotoUpload} = require('../controllers/ngos')

const animalRouter = require('./animals')
const reviewRouter = require('./review')

const router = require('express').Router();
const {protect, authorize} = require('../middleware/auth')

router.use('/:ngoId/animals', animalRouter)
router.use('/:ngoId/reviews', reviewRouter)

router.route('/radius/:zipcode/:distance')
.get(getNGOsInRadius)

router.route('/')
.get(getNGOs)
.post(protect, authorize('ngouser', 'admin'), createNGO);

router.route('/:id')
.get(getNGO)
.put(protect, authorize('ngouser', 'admin'), updateNGO)
.delete(protect, authorize('ngouser', 'admin'), deleteNGO);

router.route('/:id/photo')
.put(protect, authorize('ngouser', 'admin'), ngoPhotoUpload)

module.exports = router;

