const express = require("express");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 1. DIALOGFLOW WEBHOOK
// ==========================================

app.post("/", async (req, res) => {
    try {
        const intentName =
            req.body.queryResult?.intent?.displayName;

        console.log("Intent:", intentName);

        let responseText =
            "Sorry, I couldn't understand that.";

        // -------------------------------
        // Get Attendance
        // -------------------------------
        if (intentName === "get_attendance") {

            // Demo data
            const schoolAttendanceRate = 94;

            responseText =
                `Today's school attendance is ${schoolAttendanceRate} percent.`;
        }

        // -------------------------------
        // Unknown Intent
        // -------------------------------
        else {
            responseText =
                "Welcome to InstiFlow. How can I help you?";
        }

        res.json({
            fulfillmentText: responseText
        });

    } catch (error) {

        console.error("Webhook Error:", error);

        res.status(500).json({
            fulfillmentText:
                "Sorry, something went wrong."
        });
    }
});


// ==========================================
// 2. DEMO OAUTH AUTHORIZATION
// ==========================================

app.get("/oauth/auth", (req, res) => {

    const redirectUri = req.query.redirect_uri;
    const state = req.query.state;

    console.log("OAuth Authorization Request");
    console.log("Redirect URI:", redirectUri);
    console.log("State:", state);

    if (!redirectUri) {
        return res.status(400).send(
            "Missing redirect_uri"
        );
    }

    // DEMO ONLY
    const demoCode = "dummy_auth_code";

    const redirectUrl =
        `${redirectUri}?code=${demoCode}&state=${encodeURIComponent(state || "")}`;

    res.redirect(redirectUrl);
});


// ==========================================
// 3. DEMO OAUTH TOKEN EXCHANGE
// ==========================================

app.post("/oauth/token", (req, res) => {

    console.log("OAuth Token Request");
    console.log("Body:", req.body);

    // DEMO ONLY
    res.json({
        token_type: "bearer",

        access_token:
            "dummy_access_token_12345",

        refresh_token:
            "dummy_refresh_token_12345",

        expires_in: 3600
    });
});


// ==========================================
// 4. HEALTH CHECK
// ==========================================

app.get("/health", (req, res) => {

    res.json({
        status: "OK",
        service: "InstiFlow Google Assistant Demo"
    });
});


// ==========================================
// 5. START SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `🚀 InstiFlow running on port ${PORT}`
    );

    console.log(
        `Health: http://localhost:${PORT}/health`
    );
});
