const crypto = require("crypto");
const axios = require("axios");

const apiKey = "3cd4089eb2de1951cb4b482d77d095c2";
const apiSecret = "726571dfe8ef524ed7a81bb397a41dd6";
const apiVersion = "1.0";
const contentType = "application/json";
const method = "POST";
const action = "/api/1.0/contact?action=addOrUpdateLead";
const url = "https://api.ap-southeast-2.ivvy.com" + action;

const body = {
    name: "Shaun Cooper - Test Event",
    typeId: 110928,
    type: "Corporate",
    stageId: 492304,
    stageName: "New Lead",
    sourceId: 143093,
    sourceName: "Attended Previous Event",
    industryId: 541888,
    venueId: 34540,
    description:
        "Event Type: Other | First Date: 24/10/2025 | Second Date: 25/10/2025 | Flexible Dates: No | Time Period: Dinner | Invited Guests: 200 | Estimated Budget: $75 per person | WPForms Entry ID: 449",
    contact: {
        firstName: "Mia",
        lastName: "Ohuchi",
        email: "mia@designpluz.com.au",
        phone: "0451245122"
    }
};

// Convert to JSON string
const bodyString = JSON.stringify(body, null, 4);

// MD5 hash of bodyString
const md5 = crypto.createHash("md5").update(bodyString).digest("hex");

console.log("MD5 Hash of Body:", md5);

(async () => {
    const ivvyDate = getIvvyDate();

    const stringToSign =
        method +
        md5 +
        contentType +
        action +
        apiVersion +
        "ivvydate=" +
        ivvyDate;

    console.log("String To Sign:", stringToSign.toLowerCase());

    const signature = crypto
        .createHmac("sha1", apiSecret)
        .update(stringToSign.toLowerCase())
        .digest("hex");

    console.log("Signature:", signature);

    try {
        const response = await axios.post(url, bodyString, {
            headers: {
                "X-Api-Authorization": "IWS " + apiKey + ":" + signature,
                "IVVY-Date": ivvyDate,
                "X-Api-Version": apiVersion,
                "Content-MD5": md5,
                "Content-Type": contentType,
                Accept: "application/json"
            }
        });

        console.log("Response:", response.data);
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
})();

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
