const express = require("express");

const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/authMiddleware");

router.get("/my-notifications", requireAuth, notificationController.getMyNotifications);
router.put("/mark-read/:id", requireAuth, notificationController.markAsRead);

module.exports = router;
