const axios = require("axios");
const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");

// ==============================
// UPDATE USER
// ==============================
const updateUser = async (req, res) => {

  try {

    // User ID from Params
    const userId = req.params.id;

    // Request Body
    const updateData = req.body;

    // Debug Request Body
    console.log("Request Body:", updateData);

    // Extract Modifier ID
    const modifiedBy =
      updateData.Jains_User?.email || "UNKNOWN";

    // ==============================
    // User ID Validation
    // ==============================
    if (!userId) {

      logActivity({
        user_id: modifiedBy,
        action: "UPDATE_USER",
        module: "Jains_User",
        status: "FAILED",
        message: "User ID is required",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: "User ID is required"
      });
    }

    // ==============================
    // Empty Body Validation
    // ==============================
    if (
      !updateData ||
      Object.keys(updateData).length === 0
    ) {

      logActivity({
        user_id: modifiedBy,
        action: "UPDATE_USER",
        module: "Jains_User",
        status: "FAILED",
        message: "Update data is required",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: "Update data is required"
      });
    }

    // ==============================
    // Modified By Validation
    // ==============================
    if (!updateData.Jains_User?.email) {

      logActivity({
        user_id: "UNKNOWN",
        action: "UPDATE_USER",
        module: "Jains_User",
        status: "FAILED",
        message:
          "Jains_User.email mandatory",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message:
          "Jains_User.email field is mandatory"
      });
    }

    // ==============================
    // Get Zoho Access Token
    // ==============================
    const token = await getAccessToken();
    // Validate Modifier User in Zoho CRM
if (!updateData.Jains_User?.email) {
  return res.status(400).json({
    status: "error",
    message: "Jains_User.email field is mandatory"
  });
}

try {

  const email = updateData.Jains_User.email.trim();

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
    user_id: updateData.Jains_User?.email || "UNKNOWN",
    action: "UPDATE_USER",
    module: "Leads",
    status: "FAILED",
    message: `Invalid User Email: ${updateData.Jains_User?.email}`,
    ip_address: req.ip
  });

  return res.status(401).json({
    status: "error",
    message: "Invalid User Email"
  });
}

    // ==============================
    // Update User in Zoho
    // ==============================
    const response = await axios.put(
      `${process.env.ZOHO_DOMAIN}/crm/v8/Jains_User`,
      {
        data: [
          {
            id: String(userId),

            ...updateData
          }
        ]
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    // ==============================
    // Success Log
    // ==============================
    logActivity({
      user_id: modifiedBy,
      action: "UPDATE_USER",
      module: "Jains_User",
      status: "SUCCESS",
      message:
        `User ${userId} updated successfully`,
      ip_address: req.ip
    });

    // Return Success Response
    return res.status(response.status).json(
      response.data
    );

  } catch (err) {

    // ==============================
    // Error Log
    // ==============================
    logActivity({
      user_id:
        req.body.Jains_user?.email ||
        "UNKNOWN",
      action: "UPDATE_USER",
      module: "Jains_User",
      status: "ERROR",
      message: JSON.stringify(
        err.response?.data || err.message
      ),
      ip_address: req.ip
    });

    // Console Error
    console.log(
      err.response?.data || err.message
    );

    // Return Error Response
    return res.status(
      err.response?.status || 500
    ).json(
      err.response?.data || {
        message: err.message
      }
    );
  }
};

module.exports = { updateUser };