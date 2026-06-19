const axios = require("axios");
const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");

// ==========================================
// Search Leads By Multiple Jains Users
// ==========================================
const searchLeadsByJainsUsers = async (req, res) => {
  try {
    const bodyData = req.body || {};

    // ==========================================
    // Validate Emails
    // ==========================================
    const emails = bodyData?.Jains_User?.emails;

    if (
      !Array.isArray(emails) ||
        emails.length < 2 ||
      emails.length > 500
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Jains_User.emails must be an array containing 2 to 500 email addresses"
      });
    }

    const token = await getAccessToken();

    const foundUsers = [];
    const invalidEmails = [];

    // ==========================================
    // Fetch Users in Batches
    // ==========================================
    const batchSize = 25;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const userPromises = batch.map(async (email) => {
        try {
          const response = await axios.get(
            `${process.env.ZOHO_DOMAIN}/crm/v8/Jains_User/search`,
            {
              headers: {
                Authorization: `Zoho-oauthtoken ${token}`
              },
              params: {
                criteria: `(Email:equals:${email.trim()})`
              }
            }
          );

          if (response.data.data?.length) {
            return response.data.data[0];
          }

          invalidEmails.push(email);
          return null;
        } catch (err) {
          invalidEmails.push(email);
          return null;
        }
      });

      const users = await Promise.all(userPromises);

      foundUsers.push(...users.filter(Boolean));
    }

    // ==========================================
    // No Valid Users Found
    // ==========================================
    if (foundUsers.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No valid users found",
        invalidEmails
      });
    }

    // ==========================================
    // Create User Map
    // ==========================================
    const userMap = {};

    foundUsers.forEach((user) => {
      userMap[user.id] = {
        id: user.id,
        email: user.Email,
        name: user.Name
      };
    });

    // ==========================================
    // Search Leads For Users
    // ==========================================
    const allLeads = [];
    const leadBatchSize = 50;

    for (let i = 0; i < foundUsers.length; i += leadBatchSize) {
      const userChunk = foundUsers.slice(i, i + leadBatchSize);

      const criteria = userChunk
        .map((user) => `(Jains_User:equals:${user.id})`)
        .join("or");

      try {
        const leadResponse = await axios.get(
          `${process.env.ZOHO_DOMAIN}/crm/v8/Leads/search`,
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${token}`
            },
            params: {
              criteria
            }
          }
        );

        if (leadResponse.data.data?.length) {
          allLeads.push(...leadResponse.data.data);
        }
      } catch (err) {
        console.error(
          "Lead Search Error:",
          err.response?.data || err.message
        );
      }
    }

    // ==========================================
    // Group Leads By User Email
    // ==========================================
    const leadsByUser = {};

    foundUsers.forEach((user) => {
      leadsByUser[user.Email] = [];
    });

    allLeads.forEach((lead) => {
      const userId = lead.Jains_User?.id;

      if (!userId || !userMap[userId]) {
        return;
      }

      const email = userMap[userId].email;

      // Push complete lead record
      leadsByUser[email].push(lead);
    });

    // ==========================================
    // Log Success
    // ==========================================
    await logActivity({
      user_id: "MULTI_USER_SEARCH",
      action: "GET_LEADS",
      module: "Leads",
      status: "SUCCESS",
      message: `Fetched ${allLeads.length} leads for ${foundUsers.length} users`,
      ip_address: req.ip
    });

    // ==========================================
    // Response
    // ==========================================
    return res.status(200).json({
      status: "success",
      totalRequestedEmails: emails.length,
      totalValidUsers: foundUsers.length,
      totalInvalidEmails: invalidEmails.length,
      totalLeads: allLeads.length,
      invalidEmails,
      data: leadsByUser
    });
  } catch (err) {
    await logActivity({
      user_id: "UNKNOWN",
      action: "GET_LEADS",
      module: "Leads",
      status: "ERROR",
      message:
        err.response?.data?.data?.[0]?.message ||
        err.message,
      ip_address: req.ip
    });

    console.error(
      "Lead Search Error:",
      err.response?.data || err.message
    );

    return res.status(
      err.response?.status || 500
    ).json(
      err.response?.data || {
        status: "error",
        message: err.message
      }
    );
  }
};

module.exports = {
  searchLeadsByJainsUsers
};
