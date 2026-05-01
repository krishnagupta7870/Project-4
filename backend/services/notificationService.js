import Notification from "../models/Notification.js";
import { getIo } from "../utils/socketManager.js";

export const createNotification = async ({ userId, type, title, message, link }) => {
    try {
        const n = await Notification.create({
            userId,
            type,
            title,
            message,
            link
        });

        const io = getIo();
        if (io) {
            io.to(String(userId)).emit("new_notification", n);
        }

        return n;
    } catch (err) {
        console.error("Error creating notification:", err);
        return null;
    }
};
