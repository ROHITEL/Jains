const axios = require("axios");
const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");

// Create Lead Dynamically
const createLead = async (req, res) => {

  try {

    const leadData = req.body;

    // Extract User ID
    const userId =
      leadData.Jains_User?.email || "UNKNOWN";

    // Mandatory Fields Check
   const missingFields = [];

if (!leadData.Last_Name?.toString().trim()) {
  missingFields.push("Last_Name");
}

if (!leadData.Company?.toString().trim()) {
  missingFields.push("Company");
}

if (!leadData.Jains_User?.email) {
  missingFields.push("Jains_User.email");
}

    // Validation
    if (missingFields.length > 0) {

      logActivity({
        user_id: userId,
        action: "CREATE_LEAD",
        module: "Leads",
        status: "FAILED",
        message: `${missingFields.join(", ")} missing`,
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: `${missingFields.join(", ")} field(s) mandatory`
      });
    }

    // Get Zoho Access Token
    const token = await getAccessToken();
    // Validate Jains User in Zoho CRM
if (!leadData.Jains_User?.email) {
  return res.status(400).json({
    status: "error",
    message: "Jains_User.email field is mandatory"
  });
}

try {

  const email = leadData.Jains_User.email.trim();

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

  const zohoUser = userResponse.data.data[0];

  // Convert email lookup to Zoho lookup ID
  leadData.Jains_User = {
    id: zohoUser.id
  };

} catch (error) {

  logActivity({
    user_id: leadData.Jains_User?.email || "UNKNOWN",
    action: "CREATE_LEAD",
    module: "Leads",
    status: "FAILED",
    message: `Invalid User Email: ${leadData.Jains_User?.email}`,
    ip_address: req.ip
  });

  return res.status(401).json({
    status: "error",
    message: "Invalid User Email"
  });
}

    // Create Lead in Zoho CRM
    const response = await axios.post(
      `${process.env.ZOHO_DOMAIN}/crm/v8/Leads`,
      {
        data: [leadData]
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Success Log
    logActivity({
      user_id: userId,
      action: "CREATE_LEAD",
      module: "Leads",
      status: "SUCCESS",
      message: "Lead created successfully",
      ip_address: req.ip
    });

    // Direct Zoho Response
    return res.status(response.status).json(response.data);

  } catch (err) {

    // Error Log
    logActivity({
      user_id: req.body.Jains_User?.email || "UNKNOWN",
      action: "CREATE_LEAD",
      module: "Leads",
      status: "ERROR",
      message: JSON.stringify(err.response?.data || err.message),
      ip_address: req.ip
    });

    console.log(
      err.response?.data || err.message
    );

    // Direct Zoho Error Response
    return res.status(
      err.response?.status || 500
    ).json(
      err.response?.data || {
        message: err.message
      }
    );
  }
};

module.exports = { createLead };