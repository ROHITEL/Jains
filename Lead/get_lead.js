const axios = require("axios");
const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");


// ==============================
// GET ALL LEADS
// ==============================
exports.getLeads = async (req, res) => {

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
        action: "GET_LEADS",
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
    action: "GET_LEADS",
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

    // Fetch Leads
    const response = await axios.get(
      `${process.env.ZOHO_DOMAIN}/crm/v8/Leads`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
        params: {
          fields:
            "id,First_Name,Last_Name,Full_Name,Company,Email,Phone,Mobile,Fax,Website,Lead_Status,Lead_Source,Industry,Annual_Revenue,No_of_Employees,Rating,Skype_ID,Secondary_Email,Twitter,Street,City,State,Zip_Code,Country,Description,Created_Time,Modified_Time,Created_By,Modified_By,Owner"
        }
      }
    );

    // Success Log
    logActivity({
      user_id: userId,
      action: "GET_LEADS",
      module: "Leads",
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
      action: "GET_LEADS",
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


// ==============================
// GET LEAD BY ID
// ==============================
exports.getLeadById = async (req, res) => {

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
        action: "GET_LEAD_BY_ID",
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

    // User Validation
    if (!bodyData.Jains_User?.email) {

      logActivity({
        user_id: "UNKNOWN",
        action: "GET_LEAD_BY_ID",
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
    action: "GET_LEAD_BY_ID",
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
    // Fetch Lead By ID
    const response = await axios.get(
      `${process.env.ZOHO_DOMAIN}/crm/v8/Leads/${leadId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      }
    );

    // Success Log
    logActivity({
      user_id: userId,
      action: "GET_LEAD_BY_ID",
      module: "Leads",
      status: "SUCCESS",
      message: `Fetched Lead ${leadId}`,
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {

    // Error Log
    logActivity({
      user_id:
        req.body.Jains_User?.email || "UNKNOWN",
      action: "GET_LEAD_BY_ID",
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