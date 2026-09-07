const dotenv = require("dotenv");

// Load .env FIRST
dotenv.config();

// Some local dev machines (notably certain Windows/network setups) fail to
// resolve MongoDB Atlas's SRV DNS records with the OS default resolver.
// This works around that locally. Skip it on Vercel (VERCEL=1 is set
// automatically there) since it's unnecessary in that environment and
// overriding DNS servers isn't guaranteed to behave the same way there.
if (!process.env.VERCEL) {
    const dns = require("dns");
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const cloudinary = require("./config/cloudinary");

const authRoutes = require("./routes/authRoutes");
const skillRoutes = require("./routes/skillRoutes");
const requestRoutes = require("./routes/requestRoutes");
const marketplaceSkillRoutes = require("./routes/marketplaceSkillRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const studyGroupRoutes = require("./routes/studyGroupRoutes");
const departmentChannelRoutes = require("./routes/departmentChannelRoutes");
const adminRoutes = require("./routes/adminRoutes");
const skillRequestRoutes = require("./routes/skillRequestRoutes");
const searchRoutes = require("./routes/searchRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const directMessageRoutes = require("./routes/directMessageRoutes");
const noticeRoutes = require("./routes/noticeRoutes");

console.log("Cloudinary SDK Config:");
console.log(cloudinary.config());

(async () => {
    try {
        const result = await cloudinary.api.ping();
        console.log("✅ Cloudinary Connected");
        console.log(result);
    } catch (err) {
        console.log("❌ Cloudinary Connection Failed");
        console.log(err);
    }
})();

const app = express();

// Ensure a DB connection exists before handling any request. On Vercel this
// runs once per cold start and is skipped on warm invocations because
// connectDB() reuses the cached connection (see config/db.js).
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        res.status(500).json({ message: "Database connection failed", error: error.message });
    }
});

// Allow the local dev frontend, an explicit production frontend URL, and
// any Vercel preview deployment of that frontend (they get unique
// *.vercel.app URLs per branch/PR).
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true); // same-origin / server-to-server / curl
            if (allowedOrigins.includes(origin)) return callback(null, true);
            if (/\.vercel\.app$/.test(new URL(origin).hostname)) return callback(null, true);
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/marketplace-skills", marketplaceSkillRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/study-groups", studyGroupRoutes);
app.use("/api/department-channels", departmentChannelRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/skill-requests", skillRequestRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/messages", directMessageRoutes);
app.use("/api/notices", noticeRoutes);

app.get("/", (req, res) => {
    res.send("Scholara Backend Running");
});

app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR:");
    console.error(err);

    res.status(err.status || 500).json({
        message: err.message,
        stack: err.stack,
    });
});

// Vercel imports this exported app and calls it as a request handler —
// no app.listen() needed (and it would be ignored in that environment).
// For local development, still start a normal server.
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
}

module.exports = app;