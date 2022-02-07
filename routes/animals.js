const router = require('express').Router({mergeParams: true});
const {getAnimals, getAnimal, createAnimal, updateAnimal, deleteAnimal, getAnimalsInRadius, getAnimalsRescuedByNGO, uploadphotosOfAnimals} = require('../controllers/animals')
const {protect, authorize} = require('../middleware/auth')

router.route('/radius/:zipcode/:distance')
.get(getAnimalsInRadius)

router.route('/')
.get(getAnimals)
.post(protect, createAnimal)

router.route('/:id')
.get(getAnimal)
.put(protect, updateAnimal)
.delete(protect, deleteAnimal)

router.route('/ngo/:ngoid')
.put(protect, getAnimalsRescuedByNGO)

router.route('/:id/photo')
.put(protect, uploadphotosOfAnimals)

module.exports = router;

