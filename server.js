const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Demo OAuth credentials
const CLIENT_ID = process.env.CLIENT_ID || "google-home-test";
const CLIENT_SECRET =
  process.env.CLIENT_SECRET || "google-home-secret";

// Temporary demo authorization codes/tokens
const codes = new Map();
const tokens = new Map();

// Device state
let deviceState = {
  on: false,
};

// --------------------------------------------------
// HOME / TEST
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Google Home API server is working!",
  });
});

// --------------------------------------------------
// JSONPLACEHOLDER TEST API
// --------------------------------------------------

app.get("/todo", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.jsonplaceholder.dev/todos/1"
    );

    const todo = await response.json();

    res.json({
      success: true,
      todo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// --------------------------------------------------
// OAUTH AUTHORIZE
// --------------------------------------------------

app.get("/oauth/authorize", (req, res) => {
  const {
    client_id,
    redirect_uri,
    state,
    response_type,
  } = req.query;

  if (client_id !== CLIENT_ID) {
    return res.status(400).send("Invalid client_id");
  }

  if (response_type !== "code") {
    return res.status(400).send("Only response_type=code is supported");
  }

  // Create temporary authorization code
  const code = "demo-code-" + Date.now();

  codes.set(code, {
    client_id,
    redirect_uri,
  });

  // Redirect Google back to its OAuth callback
  const redirectUrl = new URL(redirect_uri);

  redirectUrl.searchParams.set("code", code);

  if (state) {
    redirectUrl.searchParams.set("state", state);
  }

  res.redirect(redirectUrl.toString());
});

// --------------------------------------------------
// OAUTH TOKEN
// --------------------------------------------------

app.post("/oauth/token", (req, res) => {
  const {
    client_id,
    client_secret,
    code,
    grant_type,
  } = req.body;

  // Also support application/x-www-form-urlencoded
  const clientId = client_id;
  const clientSecret = client_secret;

  if (clientId !== CLIENT_ID) {
    return res.status(401).json({
      error: "invalid_client",
    });
  }

  if (clientSecret !== CLIENT_SECRET) {
    return res.status(401).json({
      error: "invalid_client",
    });
  }

  if (grant_type !== "authorization_code") {
    return res.status(400).json({
      error: "unsupported_grant_type",
    });
  }

  if (!codes.has(code)) {
    return res.status(400).json({
      error: "invalid_grant",
    });
  }

  codes.delete(code);

  const accessToken = "demo-token-" + Date.now();

  tokens.set(accessToken, {
    client_id: clientId,
  });

  res.json({
    token_type: "Bearer",
    access_token: accessToken,
    expires_in: 3600,
  });
});

// --------------------------------------------------
// GOOGLE HOME FULFILLMENT
// --------------------------------------------------

app.post("/fulfillment", async (req, res) => {
  try {
    const intent = req.body.inputs?.[0]?.intent;

    console.log("Google Home Intent:", intent);

    // ------------------------------
    // SYNC
    // ------------------------------

    if (intent === "action.devices.SYNC") {
      return res.json({
        requestId: req.body.requestId,

        payload: {
          agentUserId: "demo-user-1",

          devices: [
            {
              id: "todo_light_1",
              type: "action.devices.types.LIGHT",
              traits: [
                "action.devices.traits.OnOff",
              ],

              name: {
                defaultNames: ["Todo Light"],
                name: "Todo Light",
                nicknames: ["Todo", "Test Light"],
              },

              willReportState: false,

              deviceInfo: {
                manufacturer: "Google Home API Test",
                model: "Todo Device",
                hwVersion: "1.0",
                swVersion: "1.0",
              },
            },
          ],
        },
      });
    }

    // ------------------------------
    // QUERY
    // ------------------------------

    if (intent === "action.devices.QUERY") {
      const deviceStates = {};

      for (const device of req.body.inputs[0].payload.devices) {
        deviceStates[device.id] = {
          online: true,
          on: deviceState.on,
        };
      }

      return res.json({
        requestId: req.body.requestId,

        payload: {
          devices: deviceStates,
        },
      });
    }

    // ------------------------------
    // EXECUTE
    // ------------------------------

    if (intent === "action.devices.EXECUTE") {
      const commands = [];

      for (const command of req.body.inputs[0].payload.commands) {
        for (const device of command.devices) {
          const execution = command.execution[0];

          if (execution.command === "action.devices.commands.OnOff") {
            const requestedState = execution.params.on;

            deviceState.on = requestedState;

            commands.push({
              ids: [device.id],
              status: "SUCCESS",
              states: {
                online: true,
                on: deviceState.on,
              },
            });
          }
        }
      }

      return res.json({
        requestId: req.body.requestId,

        payload: {
          commands,
        },
      });
    }

    // ------------------------------
    // DISCONNECT
    // ------------------------------

    if (intent === "action.devices.DISCONNECT") {
   return res.json({});
    }

    return res.status(400).json({
      error: "Unknown intent",
      intent,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
