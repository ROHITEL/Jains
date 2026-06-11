const axios = require("axios");
const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");

// Delete single lead by ID
const deleteLeadById = async (req, res) => {

  try {

    const leadId = req.params.id;

    // Request Body
    const bodyData = req.body;

    // Extract User ID
    const userId =
      bodyData.Jains_User?.email || "UNKNOWN";

    // Lead ID Validation
    if (!leadId) {

      logActivity({
        user_id: userId,
        action: "DELETE_LEAD_BY_ID",
        module: "Leads",
        status: "FAILED",
        message: "Lead ID is required",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: "Lead ID is required"
      });
    }

    // Deleted By Validation
    if (!bodyData.Jains_User?.email) {

      logActivity({
        user_id: "UNKNOWN",
        action: "DELETE_LEAD_BY_ID",
        module: "Leads",
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
    action: "DELETE_LEAD_BY_ID",
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

    // Delete Lead
    const response = await axios.delete(
      `${process.env.ZOHO_DOMAIN}/crm/v8/Leads/${String(leadId)}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      }
    );

    // Success Log
    logActivity({
      user_id: userId,
      action: "DELETE_LEAD_BY_ID",
      module: "Leads",
      status: "SUCCESS",
      message: `Lead ${leadId} deleted successfully`,
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {

    // Error Log
    logActivity({
      user_id:
        req.body.Jains_User?.email || "UNKNOWN",
      action: "DELETE_LEAD_BY_ID",
      module: "Leads",
      status: "ERROR",
      message: JSON.stringify(
        err.response?.data || err.message
      ),
      ip_address: req.ip
    });

    console.log(
      err.response?.data || err.message
    );

    return res.status(
      err.response?.status || 500
    ).json(
      err.response?.data || {
        message: err.message
      }
    );
  }
};

// Delete multiple leads by IDs
const deleteLeadsByIds = async (req, res) => {

  try {

    const ids = req.query.ids;

    // Request Body
    const bodyData = req.body;

    // Extract User ID
    const userId =
      bodyData.Jains_User?.email || "UNKNOWN";

    // IDs Validation
    if (!ids) {

      logActivity({
        user_id: userId,
        action: "DELETE_MULTIPLE_LEADS",
        module: "Leads",
        status: "FAILED",
        message: "ids query parameter required",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: "ids query parameter is required"
      });
    }

    // Deleted By Validation
    if (!bodyData.Jains_User?.email) {

      logActivity({
        user_id: "UNKNOWN",
        action: "DELETE_MULTIPLE_LEADS",
        module: "Leads",
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
    action: "DELETE_MULTIPLE_LEADS",
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

    // Delete Multiple Leads
    const response = await axios.delete(
      `${process.env.ZOHO_DOMAIN}/crm/v8/Leads`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
        params: {
          ids: ids
        }
      }
    );

    // Success Log
    logActivity({
      user_id: userId,
      action: "DELETE_MULTIPLE_LEADS",
      module: "Leads",
      status: "SUCCESS",
      message: `Deleted Leads: ${ids}`,
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {

    // Error Log
    logActivity({
      user_id:
        req.body.Jains_User?.email || "UNKNOWN",
      action: "DELETE_MULTIPLE_LEADS",
      module: "Leads",
      status: "ERROR",
      message: JSON.stringify(
        err.response?.data || err.message
      ),
      ip_address: req.ip
    });

    console.log(
      err.response?.data || err.message
    );

    return res.status(
      err.response?.status || 500
    ).json(
      err.response?.data || {
        message: err.message
      }
    );
  }
};

module.exports = {
  deleteLeadById,
  deleteLeadsByIds
};