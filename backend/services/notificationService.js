const Notification = require("../models/Notification");
const Researcher = require("../models/Researcher");

async function createNotification(payload) {
  return Notification.create(payload);
}

async function notifyAllResearchers({ title, message, type = "research", meta = {} }) {
  const researchers = await Researcher.find({}, "_id").lean();

  if (!researchers.length) return;

  await Notification.insertMany(
    researchers.map((researcher) => ({
      userId: researcher._id,
      role: "researcher",
      title,
      message,
      type,
      meta,
    }))
  );
}

module.exports = {
  createNotification,
  notifyAllResearchers,
};
