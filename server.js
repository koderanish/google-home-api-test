const express = require('express');

const app = express();

app.use(express.json());

app.post('/', async (req, res) => {
    try {
        const intentName = req.body.queryResult?.intent?.displayName;

        let responseText = "Sorry, I couldn't understand that.";

        if (intentName === 'get_attendance') {
            // TODO: Fetch from InstiFlow PostgreSQL
            const schoolAttendanceRate = 94;

            responseText =
                `Today's school attendance is ${schoolAttendanceRate} percent.`;
        }

        res.json({
            fulfillmentText: responseText
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            fulfillmentText:
                "Sorry, something went wrong while getting the information."
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`InstiFlow running on port ${PORT}`);
});
