const axios = require("axios");
const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");

// Delete User By ID
const deleteUserById = async (req, res) => {

  try {

    // Record ID from params
    const { id } = req.params;

    // Request Body
    const bodyData = req.body;

    // Extract User ID
    const userId =
      bodyData.Jains_User?.email || "UNKNOWN";

    // Record ID Validation
    if (!id) {

      logActivity({
        user_id: userId,
        action: "DELETE_USER_BY_ID",
        module: "Jains_User",
        status: "FAILED",
        message: "Record ID is required",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: "Record ID is required"
      });
    }

    // Deleted By Validation
    if (!bodyData.Jains_User?.email) {

      logActivity({
        user_id: "UNKNOWN",
        action: "DELETE_USER_BY_ID",
        module: "Jains_User",
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
    action: "DELETE_USER",
    module: "Leads",
    status: "FAILED",
    message: `Invalid User Email: ${bodyData.Jains_User?.email}`,
    ip_address: req.ip
  });

  return res.status(401).json({
    status: "error",
    message: "Invalid User Email"
  });
}

    // Delete User
    const response = await axios.delete(
      `${process.env.ZOHO_DOMAIN}/crm/v8/Jains_User/${String(id)}`,
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
      action: "DELETE_USER_BY_ID",
      module: "Jains_User",
      status: "SUCCESS",
      message: `User ${id} deleted successfully`,
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {

    // Error Log
    logActivity({
      user_id:
        req.body.Jains_User?.email || "UNKNOWN",
      action: "DELETE_USER_BY_ID",
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

module.exports = { deleteUserById };