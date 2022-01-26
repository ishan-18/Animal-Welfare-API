const router = require('express').Router();
const {getNGOs, getNGO, createNGO, updateNGO, deleteNGO} = require('../controllers/ngos')

router.route('/')
.get(getNGOs)
.post(createNGO);

router.route('/:id')
.get(getNGO)
.put(updateNGO)
.delete(deleteNGO);

module.exports = router;