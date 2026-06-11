const axios = require("axios");
const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");

const updateLead = async (req, res) => {

  try {

    const leadId = req.params.id;

    // Dynamic update data
    const updateData = req.body;

    // Extract User ID
    const userId =
      updateData.Jains_User?.email || "UNKNOWN";

    // Lead ID Validation
    if (!leadId) {

      logActivity({
        user_id: userId,
        action: "UPDATE_LEAD",
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

    // Empty Body Validation
    if (
      !updateData ||
      Object.keys(updateData).length === 0
    ) {

      logActivity({
        user_id: userId,
        action: "UPDATE_LEAD",
        module: "Leads",
        status: "FAILED",
        message: "Update data is required",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: "Update data is required"
      });
    }

    // Mandatory Field Validation
    if (!updateData.Jains_User?.email) {

      logActivity({
        user_id: "UNKNOWN",
        action: "UPDATE_LEAD",
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
   // ADD THIS
  updateData.Jains_Edited_By  = {
    id: zohoUser.id
  };
delete updateData.Jains_User;

} catch (error) {

  logActivity({
    user_id: updateData.Jains_User?.email || "UNKNOWN",
    action: "UPDATE_LEAD",
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

    // Update Lead in Zoho
    const response = await axios.put(
      `${process.env.ZOHO_DOMAIN}/crm/v8/Leads`,
      {
        data: [
          {
            id: leadId,
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

    // Success Log
    logActivity({
      user_id: userId,
      action: "UPDATE_LEAD",
      module: "Leads",
      status: "SUCCESS",
      message: `Lead ${leadId} updated successfully`,
      ip_address: req.ip
    });

    // Direct Zoho Response
    return res.status(response.status).json(
      response.data
    );

  } catch (err) {

    // Error Log
    logActivity({
      user_id:
        req.body.Jains_User?.email || "UNKNOWN",
      action: "UPDATE_LEAD",
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

module.exports = { updateLead };