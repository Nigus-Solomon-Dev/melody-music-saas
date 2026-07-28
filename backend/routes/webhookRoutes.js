const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../webhooks/webhookHandler');

router.post('/stripe', handleWebhook);
module.exports = router;