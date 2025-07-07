// SMS Backend with Twilio Integration
// Save this as server.js

const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

// Validation function
function validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
}

// SMS sending endpoint
app.post('/send-sms', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        // Validation
        if (!to || !message) {
            return res.status(400).json({ 
                error: 'Phone number and message are required' 
            });
        }
        
        if (!validatePhoneNumber(to)) {
            return res.status(400).json({ 
                error: 'Invalid phone number format' 
            });
        }
        
        if (message.length > 160) {
            return res.status(400).json({ 
                error: 'Message exceeds 160 characters' 
            });
        }
        
        // Send SMS via Twilio
        const result = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: to
        });
        
        console.log(`SMS sent successfully. SID: ${result.sid}`);
        
        res.json({ 
            success: true, 
            messageSid: result.sid,
            status: result.status
        });
        
    } catch (error) {
        console.error('Error sending SMS:', error);
        
        // Handle specific Twilio errors
        if (error.code === 21211) {
            return res.status(400).json({ 
                error: 'Invalid phone number' 
            });
        }
        
        if (error.code === 21608) {
            return res.status(400).json({ 
                error: 'Phone number is not verified or not reachable' 
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to send SMS: ' + error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint to verify Twilio connection
app.get('/test-twilio', async (req, res) => {
    try {
        const account = await client.api.accounts(accountSid).fetch();
        res.json({ 
            success: true, 
            account: account.friendlyName,
            status: account.status 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Twilio connection failed: ' + error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`SMS Backend server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Test Twilio: http://localhost:${PORT}/test-twilio`);
});

// Export for testing
module.exports = app;