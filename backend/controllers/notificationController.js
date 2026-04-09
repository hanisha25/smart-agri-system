const Notification = require("../models/Notification");

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id,
      role: req.user.role,
    })
      .sort({ createdAt: -1 })
      .limit(25);

    const unreadCount = notifications.filter((item) => !item.read).length;

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        role: req.user.role,
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification" });
  }
};
