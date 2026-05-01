import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { productUpload } from "../../middleware/fileUpload.js";
import { protect, adminOnly } from "../../middleware/auth.js";
import Product from "../../models/Product.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to settings.json in the root uploads folder
// api/admin/settings.js -> ../../uploads/settings.json
const SETTINGS_PATH = path.join(__dirname, "../../uploads/settings.json");

const router = express.Router();

// Helper to ensure settings file exists
const ensureSettingsFile = async () => {
  try {
    await fs.access(SETTINGS_PATH);
  } catch {
    // Create uploads folder if it doesn't exist (though it should)
    try {
        await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
    } catch {}
    await fs.writeFile(SETTINGS_PATH, JSON.stringify({
      logo: "",
      boostPackages: [
        { label: "6 Hours", hours: 6, price: 100 },
        { label: "12 Hours", hours: 12, price: 180 },
        { label: "24 Hours", hours: 24, price: 320 },
        { label: "3 Days", hours: 72, price: 800 },
        { label: "7 Days", hours: 168, price: 1600 }
      ]
    }, null, 2));
  }
};

// GET /api/admin/settings/logo
// Publicly accessible so Navbar can read it (or protect if strictly private, but logos are usually public)
router.get("/logo", async (req, res) => {
  try {
    await ensureSettingsFile();
    const data = await fs.readFile(SETTINGS_PATH, "utf-8");
    const settings = JSON.parse(data);
    res.json({ logo: settings.logo || "" });
  } catch (err) {
    console.error("Get Logo Error:", err);
    res.status(500).json({ message: "Failed to fetch logo" });
  }
});

// PUT /api/admin/settings/logo
router.put("/logo", protect, adminOnly, productUpload.single("logo"), async (req, res) => {
  try {
    await ensureSettingsFile();
    
    let logoPath = req.body.url;
    
    if (req.file) {
      logoPath = req.file.path;
    }

    // Read current settings
    const data = await fs.readFile(SETTINGS_PATH, "utf-8");
    const settings = JSON.parse(data);

    if (req.body.reset === "true") {
        logoPath = "";
    } else if (!logoPath) {
        // If no new file/url and not resetting, keep existing
        logoPath = settings.logo;
    }

    settings.logo = logoPath;
    
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    
    res.json({ message: "Logo updated", logo: logoPath });
  } catch (err) {
    console.error("Update Logo Error:", err);
    res.status(500).json({ message: "Failed to update logo" });
  }
});

// GET /api/admin/settings/footer
router.get("/footer", async (req, res) => {
  try {
    await ensureSettingsFile();
    const data = await fs.readFile(SETTINGS_PATH, "utf-8");
    const settings = JSON.parse(data);

    // If footer settings are missing or empty, generate dynamic default
    if (!settings.footer || !settings.footer.columns || settings.footer.columns.length === 0) {
      
      const defaultFooter = {
        columns: [
          {
            title: "About",
            links: [
              { label: "About Us", url: "/about" },
              { label: "Contact Us", url: "/contact" },
              { label: "Careers", url: "/careers" },
              { label: "DealMate Stories", url: "/stories" },
              { label: "Press", url: "/press" }
            ]
          },
          {
            title: "Help",
            links: [
              { label: "Payments", url: "/payments" },
              { label: "Shipping", url: "/shipping" },
              { label: "Cancellation & Returns", url: "/returns" },
              { label: "FAQ", url: "/faq" },
              { label: "Report Infringement", url: "/report-infringement" }
            ]
          },
          {
            title: "Consumer Policy",
            links: [
              { label: "Return Policy", url: "/return-policy" },
              { label: "Terms of Use", url: "/terms" },
              { label: "Security", url: "/security" },
              { label: "Privacy", url: "/privacy" },
              { label: "Sitemap", url: "/sitemap" }
            ]
          },
          {
            title: "Sell on DealMate",
            links: [
              { label: "Sell on DealMate", url: "/seller" },
              { label: "Seller Support", url: "/seller/support" },
              { label: "Advertise", url: "/advertise" }
            ]
          }
        ],
        socials: {
          facebook: "https://facebook.com",
          instagram: "https://instagram.com",
          twitter: "https://twitter.com",
          youtube: "https://youtube.com"
        },
        apps: {
           playStore: "#",
           appStore: "#"
        }
      };

      return res.json(defaultFooter);
    }

    res.json(settings.footer);
  } catch (err) {
    console.error("Get Footer Error:", err);
    res.status(500).json({ message: "Failed to fetch footer settings" });
  }
});

// PUT /api/admin/settings/footer
router.put("/footer", protect, adminOnly, async (req, res) => {
  try {
    await ensureSettingsFile();
    const { columns, socials, apps } = req.body;

    const data = await fs.readFile(SETTINGS_PATH, "utf-8");
    const settings = JSON.parse(data);

    settings.footer = {
      columns: columns || settings.footer?.columns || [],
      socials: socials || settings.footer?.socials || {},
      apps: apps || settings.footer?.apps || {}
    };

    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    res.json({ message: "Footer settings updated", footer: settings.footer });
  } catch (err) {
    console.error("Update Footer Error:", err);
    res.status(500).json({ message: "Failed to update footer settings" });
  }
});

// GET /api/admin/settings/boost-packages (public for sellers to read)
router.get("/boost-packages", async (req, res) => {
  try {
    await ensureSettingsFile();
    const data = await fs.readFile(SETTINGS_PATH, "utf-8");
    const settings = JSON.parse(data);
    const pkgs = Array.isArray(settings.boostPackages) ? settings.boostPackages : [];
    res.json(pkgs);
  } catch (err) {
    console.error("Get Boost Packages Error:", err);
    res.status(500).json({ message: "Failed to fetch boost packages" });
  }
});

// PUT /api/admin/settings/boost-packages (admin only)
router.put("/boost-packages", protect, adminOnly, async (req, res) => {
  try {
    await ensureSettingsFile();
    const { packages } = req.body;
    if (!Array.isArray(packages)) {
      return res.status(400).json({ message: "packages[] is required" });
    }
    const normalized = packages.map(p => ({
      label: String(p.label || "").trim() || `${Number(p.hours)} Hours`,
      hours: Number(p.hours),
      price: Number(p.price)
    })).filter(p => p.hours > 0 && p.price >= 0);
    if (normalized.length === 0) {
      return res.status(400).json({ message: "No valid packages" });
    }
    const data = await fs.readFile(SETTINGS_PATH, "utf-8");
    const settings = JSON.parse(data);
    settings.boostPackages = normalized;
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    res.json({ message: "Boost packages updated", packages: normalized });
  } catch (err) {
    console.error("Update Boost Packages Error:", err);
    res.status(500).json({ message: "Failed to update boost packages" });
  }
});

export default router;
