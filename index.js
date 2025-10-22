import express from "express";
import crypto from "crypto";
import axios from "axios";

const app = express();
app.use(express.json()); // Parse JSON body

app.post("/ivvy/add-lead", async (req, res) => {
    const clientAuthHeader = req.headers["API-Authorization"] || req.headers["api-authorization"];
    const serverAuthKey = process.env.SERVER_API_AUTH_KEY;

     if (clientAuthHeader !== serverAuthKey) {
        return res.status(401).json({ error: "Unauthorized: Invalid API key" });
    }

    const apiKey = process.env.IVVY_API_KEY;
    const apiSecret = process.env.IVVY_API_SECRET;

    if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: "Missing API credentials" });
    }

    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
        return res.status(400).json({ error: "Body cannot be empty" });
    }

    // Convert to compact JSON
    const bodyString = JSON.stringify(body);
    const md5 = crypto.createHash("md5").update(bodyString).digest("hex");

    const apiVersion = "1.0";
    const contentType = "application/json";
    const method = "POST";
    const action = "/api/1.0/contact?action=addOrUpdateLead";
    const url = "https://api.ap-southeast-2.ivvy.com" + action;
    const ivvyDate = getIvvyDate();

    const stringToSign = (
        method +
        md5 +
        contentType +
        action +
        apiVersion +
        "ivvydate=" +
        ivvyDate
    ).toLowerCase();

    const signature = crypto
        .createHmac("sha1", apiSecret)
        .update(stringToSign)
        .digest("hex");

    try {
        const response = await axios.post(url, bodyString, {
            headers: {
                "X-Api-Authorization": `IWS ${apiKey}:${signature}`,
                "IVVY-Date": ivvyDate,
                "X-Api-Version": apiVersion,
                "Content-MD5": md5,
                "Content-Type": contentType,
                Accept: "application/json",
            },
        });

        return res.status(200).json(response.data);
    } catch (err) {
        console.error("iVvy Error:", err.response?.data || err.message);
        return res
            .status(400)
            .json(err.response?.data || { error: err.message });
    }
});

// Simple test route
app.get("/", (req, res) => {
    res.send("✅ iVvy API Server is running!");
});

function getIvvyDate() {
    const d = new Date();
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const minutes = String(d.getUTCMinutes()).padStart(2, "0");
    const seconds = String(d.getUTCSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Export the app for Vercel serverless
export default app;
