const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 1. Dialogflow Intent & SmartHome Routing Endpoint ---
app.post('/', async (req, res) => {
    try {
        const intentName = req.body.queryResult?.intent?.displayName;
        
        // Extract Google Smart Home Intents if they exist
        const smartHomeIntent = req.body.inputs?.[0]?.intent;

        // A. Handle Google Smart Home SYNC Handshake
        if (smartHomeIntent === 'action.devices.SYNC') {
            return res.json({
                requestId: req.body.requestId,
                payload: {
                    agentUserId: "user_instiflow_123",
                    devices: [{
                        id: "instiflow_voice_sensor",
                        type: "action.devices.types.SENSOR",
                        traits: ["action.devices.traits.SensorState"],
                        name: { name: "InstiFlow Tracker" },
                        willReportState: false
                    }]
                }
            });
        }

        // B. Handle Google Smart Home QUERY (Fixes the Offline Error)
        if (smartHomeIntent === 'action.devices.QUERY') {
            return res.json({
                requestId: req.body.requestId,
                payload: {
                    devices: {
                        "instiflow_voice_sensor": {
                            "online": true,
                            "status": "SUCCESS"
                        }
                    }
                }
            });
        }

        // C. Standard Conversational Dialogflow Text Intent Matching
        let responseText = "Sorry, I couldn't understand that.";
        if (intentName === 'get_attendance') {
            const schoolAttendanceRate = 94;
            responseText = `Today's school attendance is ${schoolAttendanceRate} percent.`;
        }

        res.json({ fulfillmentText: responseText });
    } catch (error) {
        console.error(error);
        res.status(500).json({ fulfillmentText: "Sorry, something went wrong." });
    }
});

// --- 2. Dummy OAuth Authorization Page ---
app.get('/oauth/auth', (req, res) => {
    const redirectUri = req.query.redirect_uri;
    const state = req.query.state;
    if (!redirectUri) return res.status(400).send("Missing redirect_uri");
    res.redirect(`${redirectUri}?code=dummy_auth_code&state=${state}`);
});

// --- 3. Dummy OAuth Token Exchange Endpoint ---
app.post('/oauth/token', (req, res) => {
    res.json({
        token_type: "bearer",
        access_token: "dummy_access_token_12345",
        refresh_token: "dummy_refresh_token_12345",
        expires_in: 3600
    });
});

// --- 4. Health Check Route ---
app.get('/health', (req, res) => {
    res.json({ status: "OK", service: "InstiFlow" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`InstiFlow running on port ${PORT}`));
