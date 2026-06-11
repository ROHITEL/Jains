const axios = require("axios");
const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");

// ==========================================
// Search Leads By Jains User Email
// ==========================================
const searchLeadsByJainsUser = async (req, res) => {
  try {
    const bodyData = req.body || {};

    // ==========================================
    // Validate Email
    // ==========================================
    if (!bodyData.Jains_User?.email) {
      return res.status(400).json({
        status: "error",
        message: "Jains_User.email field is mandatory"
      });
    }

    const token = await getAccessToken();
    const email = bodyData.Jains_User.email.trim();

    let zohoUser;

    // ==========================================
    // Verify Jains User
    // ==========================================
    try {
      const userResponse = await axios.get(
        `${process.env.ZOHO_DOMAIN}/crm/v8/Jains_User/search`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${token}`
          },
          params: {
            criteria: `(Email:equals:${email})`
          }
        }
      );

      if (
        !userResponse.data.data ||
        userResponse.data.data.length === 0
      ) {
        throw new Error("User not found");
      }

      zohoUser = userResponse.data.data[0];
    } catch (error) {
      await logActivity({
        user_id: email,
        action: "GET_LEADS",
        module: "Leads",
        status: "FAILED",
        message: `Invalid User Email: ${email}`,
        ip_address: req.ip
      });

      return res.status(401).json({
        status: "error",
        message: "Invalid User Email"
      });
    }

    // ==========================================
    // Search Leads Using Jains User ID
    // ==========================================
    const criteria = `(Jains_User:equals:${zohoUser.id})`;

    const leadResponse = await axios.get(
      `${process.env.ZOHO_DOMAIN}/crm/v8/Leads/search`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`
        },
        params: {
          criteria,
          fields:
            "id,Last_Name,Company,Email,Phone,Jains_User"
        }
      }
    );

    const leads = leadResponse.data.data || [];

    // ==========================================
    // Success Log
    // ==========================================
    await logActivity({
      user_id: zohoUser.id,
      action: "GET_LEADS",
      module: "Leads",
      status: "SUCCESS",
      message: `Fetched ${leads.length} leads`,
      ip_address: req.ip
    });

    // ==========================================
    // Response
    // ==========================================
    return res.status(200).json({
      status: "success",
      user: {
        id: zohoUser.id,
        email: zohoUser.Email,
        name: zohoUser.Name
      },
      totalLeads: leads.length,
      leads
    });

  } catch (err) {

    await logActivity({
      user_id: req.body?.Jains_User?.email || "UNKNOWN",
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
  searchLeadsByJainsUser
};