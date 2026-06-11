const axios = require("axios");
const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");

// ==============================
// CREATE USER
// ==============================
const createuser = async (req, res) => {

  try {

    // Dynamic Input Data
    const userData = req.body;

    // Extract User ID
    const userId =
      userData.Jains_User?.email || "UNKNOWN";

    // ==============================
    // Required Field Validation
    // ==============================

    const missingFields = [];

    if (!userData.Email?.toString().trim()) {
      missingFields.push("Email");
    }

    if (!userData.Name?.toString().trim()) {
      missingFields.push("Name");
    }

    if (!userData.User_Role?.toString().trim()) {
      missingFields.push("User_Role");
    }

    // Required Field Error
    if (missingFields.length > 0) {

      logActivity({
        user_id: userId,
        action: "CREATE_USER",
        module: "Jains_User",
        status: "FAILED",
        message:
          `${missingFields.join(", ")} mandatory`,
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message:
          `${missingFields.join(", ")} field(s) mandatory`
      });
    }

    // ==============================
    // Conditional Validation
    // ==============================

    if (userData.User_Role === "Normal") {

      // Jains_Created_By Validation
      if (!userData.Jains_User?.email) {

        logActivity({
          user_id: "UNKNOWN",
          action: "CREATE_USER",
          module: "Jains_User",
          status: "FAILED",
          message:
            "Jains_User.email mandatory",
          ip_address: req.ip
        });

        return res.status(400).json({
          status: "error",
          message:
            "Jains_User.email is required when User_Role is Normal"
        });
      }

      // User_Reporting_To Validation
      if (!userData.User_Reporting_To?.email) {

        logActivity({
          user_id: userId,
          action: "CREATE_USER",
          module: "Jains_User",
          status: "FAILED",
          message:
            "User_Reporting_To.email mandatory",
          ip_address: req.ip
        });

        return res.status(400).json({
          status: "error",
          message:
            "User_Reporting_To.email is required when User_Role is Normal"
        });
      }
    }

    // Get Zoho Token
    const token = await getAccessToken();
    let reportingToId = null;

if (userData.User_Reporting_To?.email) {

 const searchResponse = await axios.get(
  `${process.env.ZOHO_DOMAIN}/crm/v8/Jains_User/search?criteria=(Email:equals:${encodeURIComponent(
      userData.User_Reporting_To.email
  )})`,
    {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`
      }
    }
  );

  if (
    searchResponse.data.data &&
    searchResponse.data.data.length > 0
  ) {
    reportingToId = searchResponse.data.data[0].id;
  } else {
    return res.status(400).json({
      status: "error",
      message: "User_Reporting_To email not found"
    });
  }
};

userData.Jains_User_Reporting_To = {
    id:reportingToId
  };

    // Create User
    const response = await axios.post(
      `${process.env.ZOHO_DOMAIN}/crm/v8/Jains_User`,
      {
        data: [
          userData
        ]
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
      action: "CREATE_USER",
      module: "Jains_User",
      status: "SUCCESS",
      message: "User created successfully",
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {

    // Error Log
    logActivity({
      user_id:
        req.body.Jains_User?.email ||
        "UNKNOWN",
      action: "CREATE_USER",
      module: "Jains_User",
      status: "ERROR",
      message: JSON.stringify(
        err.response?.data || err.message
      ),
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

module.exports = { createuser };