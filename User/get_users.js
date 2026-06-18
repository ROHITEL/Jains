const axios = require("axios");
const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");


// ==============================
// GET ALL LEADS
// ==============================
exports.getusers = async (req, res) => {

  try {

    // Request Body
    const bodyData = req.body;

    // Extract User ID
    const userId =
      bodyData.Jains_User?.email || "UNKNOWN";

    // Validation
    if (!bodyData.Jains_User?.email) {

      logActivity({
        user_id: "UNKNOWN",
        action: "GET_USERS",
        module: "Jains User",
        status: "FAILED",
        message: "Jains_User.email mandatory",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: "Jains_User.email field is mandatory"
      });
    }

    // Get Zoho Token
    const token = await getAccessToken();
    // Validate Jains User in Zoho CRM
if (!bodyData.Jains_User?.email) {
  return res.status(400).json({
    status: "error",
    message: "Jains_User.email field is mandatory"
  });
}

try {

  const email = bodyData.Jains_User.email.trim();

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

} catch (error) {

  logActivity({
    user_id: bodyData.Jains_User?.email || "UNKNOWN",
    action: "GET_USERS",
    module: "Jains_User",
    status: "FAILED",
    message: `Invalid User Email: ${bodyData.Jains_User?.email}`,
    ip_address: req.ip
  });

  return res.status(401).json({
    status: "error",
    message: "Invalid User Email"
  });
}

    // Fetch Leads
    const response = await axios.get(
      `${process.env.ZOHO_DOMAIN}/crm/v8/Jains_User`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
        params: {
          fields:
            "id,Name,Email"
        }
      }
    );

    // Success Log
    logActivity({
      user_id: userId,
      action: "GET_USERS",
      module: "Jains User",
      status: "SUCCESS",
      message: "Fetched all leads successfully",
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {

    // Error Log
    logActivity({
      user_id:
        req.body.Jains_User?.email || "UNKNOWN",
      action: "GET_USERS",
      module: "Jains User",
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


// ==============================
// GET USER BY EMAIL
// ==============================
exports.getUserByEmail = async (req, res) => {
  try {
    // Request Body
    const bodyData = req.body;

    // Extract Email
    const email = bodyData.Jains_User?.email?.trim();

    // Email Validation
    if (!email) {
      logActivity({
        user_id: "UNKNOWN",
        action: "GET_USER_BY_EMAIL",
        module: "Jains User",
        status: "FAILED",
        message: "Jains_User.email is mandatory",
        ip_address: req.ip,
      });

      return res.status(400).json({
        status: "error",
        message: "Jains_User.email field is mandatory",
      });
    }

    // Get Zoho Token
    const token = await getAccessToken();

    // Fetch User By Email from Zoho
    const userResponse = await axios.get(
      `${process.env.ZOHO_DOMAIN}/crm/v8/Jains_User/search`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
        params: {
          criteria: `(Email:equals:${email})`,
        },
      }
    );

    // Check if user exists
    if (
      !userResponse.data?.data ||
      userResponse.data.data.length === 0
    ) {
      logActivity({
        user_id: email,
        action: "GET_USER_BY_EMAIL",
        module: "Jains User",
        status: "FAILED",
        message: `User not found for email: ${email}`,
        ip_address: req.ip,
      });

      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const zohoUser = userResponse.data.data[0];

    // Success Log
    logActivity({
      user_id: email,
      action: "GET_USER_BY_EMAIL",
      module: "Jains User",
      status: "SUCCESS",
      message: `Fetched user for email: ${email}`,
      ip_address: req.ip,
    });

    return res.status(200).json({
      status: "success",
      data: zohoUser,
    });

  } catch (err) {
    // Error Log
    logActivity({
      user_id: req.body?.Jains_User?.email || "UNKNOWN",
      action: "GET_USER_BY_EMAIL",
      module: "Jains User",
      status: "ERROR",
      message: JSON.stringify(err.response?.data || err.message),
      ip_address: req.ip,
    });

    console.log(err.response?.data || err.message);

    return res.status(err.response?.status || 500).json(
      err.response?.data || { message: err.message }
    );
  }
};
