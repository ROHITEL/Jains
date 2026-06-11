const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");

const BASE_URL = `${process.env.ZOHO_DOMAIN}/crm/v8/Leads`;




// ==============================
// GET ALL ATTACHMENTS
// ==============================
const getAttachments = async (req, res) => {

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
        action: "GET_ATTACHMENTS",
        module: "Attachments",
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
        action: "GET_ATTACHMENTS",
        module: "Attachments",
        status: "FAILED",
        message: "Jains_User.email mandatory",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: "Jains_User.email field is mandatory"
      });
    }

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
  const zohoUserId = zohoUser.id;

} catch (error) {

  logActivity({
    user_id: bodyData.Jains_User?.email || "UNKNOWN",
    action: "GET_ATTACHMENTS",
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

    const response = await axios.get(
      `${BASE_URL}/${leadId}/Attachments`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
        params: {
          fields:
            "File_Name,Owner,Created_Time,Modified_Time,Size"
        }
      }
    );

    // Success Log
    logActivity({
      user_id: userId,
      action: "GET_ATTACHMENTS",
      module: "Attachments",
      status: "SUCCESS",
      message: `Fetched attachments for Lead ${leadId}`,
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {

    // Error Log
    logActivity({
      user_id:
        req.body.Jains_User?.email || "UNKNOWN",
      action: "GET_ATTACHMENTS",
      module: "Attachments",
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


// ==============================
// GET ATTACHMENT BY ID
// ==============================
const getAttachmentById = async (req, res) => {

  try {

    const { leadId, attachmentId } = req.params;

    const bodyData = req.body;

    const userId =
      bodyData.Jains_User?.email || "UNKNOWN";

    // Validation
    if (!leadId || !attachmentId) {

      logActivity({
        user_id: userId,
        action: "GET_ATTACHMENT_BY_ID",
        module: "Attachments",
        status: "FAILED",
        message: "Lead ID and Attachment ID required",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message:
          "Lead ID and Attachment ID are required"
      });
    }

    if (!bodyData.Jains_User?.email) {

      logActivity({
        user_id: "UNKNOWN",
        action: "GET_ATTACHMENT_BY_ID",
        module: "Attachments",
        status: "FAILED",
        message: "Jains_User.email mandatory",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: "Jains_User.email field is mandatory"
      });
    }

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
  const zohoUserId = zohoUser.id;

} catch (error) {

  logActivity({
    user_id: bodyData.Jains_User?.email || "UNKNOWN",
    action: "GET_ATTACHMENTS_BY_ID",
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

    const response = await axios.get(
      `${BASE_URL}/${leadId}/Attachments/${attachmentId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
        responseType: "stream"
      }
    );

    // Success Log
    logActivity({
      user_id: userId,
      action: "GET_ATTACHMENT_BY_ID",
      module: "Attachments",
      status: "SUCCESS",
      message:
        `Fetched attachment ${attachmentId}`,
      ip_address: req.ip
    });

    response.data.pipe(res);

  } catch (err) {

    logActivity({
      user_id:
        req.body.Jains_User?.email || "UNKNOWN",
      action: "GET_ATTACHMENT_BY_ID",
      module: "Attachments",
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


// ==============================
// UPLOAD ATTACHMENT
// ==============================
const uploadAttachment = async (req, res) => {

  try {

    const leadId = req.params.id;

    const bodyData = req.body;

    const userId =
      bodyData.Jains_User?.email || "UNKNOWN";

    // Validation
    if (!leadId) {

      logActivity({
        user_id: userId,
        action: "UPLOAD_ATTACHMENT",
        module: "Attachments",
        status: "FAILED",
        message: "Lead ID required",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: "Lead ID is required"
      });
    }

    if (!bodyData.Jains_User?.email) {

      logActivity({
        user_id: "UNKNOWN",
        action: "UPLOAD_ATTACHMENT",
        module: "Attachments",
        status: "FAILED",
        message: "Jains_User.email mandatory",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: "Jains_User.email field is mandatory"
      });
    }

    if (!bodyData.filePath) {

      logActivity({
        user_id: userId,
        action: "UPLOAD_ATTACHMENT",
        module: "Attachments",
        status: "FAILED",
        message: "filePath required",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message: "filePath is required"
      });
    }

    const token = await getAccessToken();
    // Validate Jains User in Zoho CRM
if (!bodyData.Jains_User?.email) {
  return res.status(400).json({
    status: "error",
    message: "Jains_User.email field is mandatory"
  });
}
let zohoUserId = null;
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
  const zohoUserId = zohoUser.id;

} catch (error) {

  logActivity({
    user_id: bodyData.Jains_User?.email || "UNKNOWN",
    action: "UPLOAD_ATTACHMENT",
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

    const form = new FormData();

    form.append(
      "file",
      fs.createReadStream(bodyData.filePath)
    );

    const response = await axios.post(
      `${BASE_URL}/${leadId}/Attachments`,
      form,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          ...form.getHeaders(),
        },
      }
    );

    // 🔥 IMPORTANT: Update Lead Modified By
    
    // Success Log
    logActivity({
      user_id: userId,
      action: "UPLOAD_ATTACHMENT",
      module: "Attachments",
      status: "SUCCESS",
      message:
        `Uploaded attachment to Lead ${leadId}`,
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {

    logActivity({
      user_id:
        req.body.Jains_User?.email || "UNKNOWN",
      action: "UPLOAD_ATTACHMENT",
      module: "Attachments",
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


// ==============================
// DELETE ATTACHMENT
// ==============================
const deleteAttachment = async (req, res) => {

  try {

    const { leadId, attachmentId } = req.params;

    const bodyData = req.body;

    const userId =
      bodyData.Jains_User?.email || "UNKNOWN";

    // Validation
    if (!leadId || !attachmentId) {

      logActivity({
        user_id: userId,
        action: "DELETE_ATTACHMENT",
        module: "Attachments",
        status: "FAILED",
        message:
          "Lead ID and Attachment ID required",
        ip_address: req.ip
      });

      return res.status(400).json({
        status: "error",
        message:
          "Lead ID and Attachment ID are required"
      });
    }

    if (!bodyData.Jains_User?.email) {

      logActivity({
        user_id: "UNKNOWN",
        action: "DELETE_ATTACHMENT",
        module: "Attachments",
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

    const token = await getAccessToken();
    // Validate Jains User in Zoho CRM
if (!bodyData.Jains_User?.email) {
  return res.status(400).json({
    status: "error",
    message: "Jains_User.email field is mandatory"
  });
}
let zohoUserId = null;
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
  const zohoUserId = zohoUser.id;

} catch (error) {

  logActivity({
    user_id: bodyData.Jains_User?.email || "UNKNOWN",
    action: "DELETE_ATTACHMENT",
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

    const response = await axios.delete(
      `${BASE_URL}/${leadId}/Attachments/${attachmentId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      }
    );

    // 🔥 IMPORTANT: Update Lead Modified By
    

    // Success Log
    logActivity({
      user_id: userId,
      action: "DELETE_ATTACHMENT",
      module: "Attachments",
      status: "SUCCESS",
      message:
        `Deleted attachment ${attachmentId}`,
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {

    logActivity({
      user_id:
        req.body.Jains_User?.email || "UNKNOWN",
      action: "DELETE_ATTACHMENT",
      module: "Attachments",
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
  getAttachments,
  getAttachmentById,
  uploadAttachment,
  deleteAttachment
};