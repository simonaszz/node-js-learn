const express = require('express');
const { getBlogList, getBlogDetail } = require('../controllers/blogController');

const router = express.Router();

router.get('/', getBlogList);
router.get('/:slug', getBlogDetail);

module.exports = router;