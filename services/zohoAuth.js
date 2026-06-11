const axios = require("axios");
require("dotenv").config();

let accessToken = null;
let expiresAt = 0;

async function getAccessToken() {
  try {

    // Return cached token if still valid
    if (accessToken && Date.now() < expiresAt) {
      return accessToken;
    }

    console.log("Refreshing Zoho access token...");

    const response = await axios.post(
      `${process.env.ZOHO_ACCOUNTS}/oauth/v2/token`,
      null,
      {
        params: {
          refresh_token: process.env.REFRESH_TOKEN,
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          grant_type: "refresh_token"
        }
      }
    );

    accessToken = response.data.access_token;

    // Zoho token validity ~1 hour
    expiresAt = Date.now() + (55 * 60 * 1000);

    return accessToken;

  } catch (error) {
    console.error(
      "Zoho Token Error:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = { getAccessToken };