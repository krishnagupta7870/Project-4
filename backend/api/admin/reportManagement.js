import Report from "../../models/Report.js";
import Notification from "../../models/Notification.js";
import { createNotification } from "../../services/notificationService.js";

/**
 * GET /api/admin/reports
 */
export const getPendingReports = async (req, res) => {
    try {
        const reports = await Report.find({})
            .populate("reporter", "name email")
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch reports" });
    }
};

/**
 * PUT /api/admin/reports/:id/resolve
 */
export const resolveReport = async (req, res) => {
    try {
        const { action, adminComment } = req.body; // 'resolved', 'dismissed'
        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status: action, adminComment },
            { new: true }
        ).populate("reporter", "name email");

        if (!report) return res.status(404).json({ message: "Report not found" });

        // Notify the reporter
        if (report.reporter) {
            await createNotification({
                userId: report.reporter._id,
                type: "report_update",
                title: `Report ${action === 'resolved' ? 'Resolved' : 'Dismissed'}`,
                message: `Your report regarding ${report.reportType} has been ${action}. ${adminComment ? `Admin reply: ${adminComment}` : ''}`,
                link: "/support" // Redirect to support page since we don't have a dedicated report status page yet
            }).catch(() => { });
        }

        res.json({ message: `Report ${action} successfully`, report });
    } catch (err) {
        console.error("Error resolving report:", err);
        res.status(500).json({ message: "Failed to resolve report" });
    }
};
