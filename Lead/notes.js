const axios = require("axios");
const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");

const BASE_URL = `${process.env.ZOHO_DOMAIN}/crm/v8/Leads`;

// ==============================
// 🔐 VALIDATION HELPERS
// ==============================

// Extracts and sanitizes the email from the request body
const validateJainsUser = (bodyData) => {
  const email = bodyData?.Jains_User?.email;
  if (!email || typeof email !== "string" || email.trim() === "") {
    return null;
  }
  return email.trim();
};

// Looks up the custom user record in Zoho and returns its numeric ID
const getZohoUserIdByEmail = async (email, token) => {
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

    if (!userResponse.data?.data || userResponse.data.data.length === 0) {
      return null;
    }

    // Returns the 19-digit numeric record ID Zoho expects for lookup fields
    return userResponse.data.data[0].id;
  } catch (error) {
    console.error("Error looking up Zoho User by email:", error.response?.data || error.message);
    return null;
  }
};


// ==============================
// 🔄 UPDATE LEAD MODIFIED BY
// ==============================
const updateLeadModifiedBy = async (leadId, userId, token, actionType) => {
  try {
    await axios.put(
      `${BASE_URL}/${leadId}`,
      {
        data: [
          {
            id: leadId,
            Jains_User: { id: userId } // Now receiving the correct numeric ID
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

    logActivity({
      user_id: userId,
      action: "UPDATE_LEAD",
      module: "Leads",
      status: "SUCCESS",
      message: `Lead ${leadId} updated from ${actionType}`,
      ip_address: "SYSTEM"
    });

  } catch (err) {
    console.error("Lead update failed:", err.response?.data || err.message);
  }
};


// ==============================
// GET ALL NOTES
// ==============================
const getNotes = async (req, res) => {
  try {
    const leadId = req.params.id;
    const bodyData = req.body;

    const email = validateJainsUser(bodyData);
    if (!leadId || !email) {
      return res.status(400).json({
        status: "error",
        message: "Lead ID and valid Jains_User.email required"
      });
    }

    const token = await getAccessToken();

    // Validate User exists in Zoho
    const zohoUserId = await getZohoUserIdByEmail(email, token);
    if (!zohoUserId) {
      logActivity({
        user_id: email,
        action: "GET_NOTES",
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

    const response = await axios.get(
      `${BASE_URL}/${leadId}/Notes`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`
        },
        params: {
          fields: "Note_Title,Note_Content,Created_Time,Modified_Time,Owner"
        }
      }
    );

    logActivity({
      user_id: email,
      action: "GET_NOTES",
      module: "Notes",
      status: "SUCCESS",
      message: `Fetched notes for Lead ${leadId}`,
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(err.response?.status || 500).json(
      err.response?.data || { message: err.message }
    );
  }
};


// ==============================
// CREATE NOTE
// ==============================
const createNote = async (req, res) => {
  try {
    const leadId = req.params.id;
    const bodyData = req.body;

    const email = validateJainsUser(bodyData);
    if (!leadId || !email) {
      return res.status(400).json({
        status: "error",
        message: "Lead ID and valid Jains_User.email required"
      });
    }

    if (!bodyData.note || bodyData.note.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Note content is required"
      });
    }

    const token = await getAccessToken();

    // Validate User and get lookup ID
    const zohoUserId = await getZohoUserIdByEmail(email, token);
    if (!zohoUserId) {
      logActivity({
        user_id: email,
        action: "CREATE_NOTE",
        module: "Leads",
        status: "FAILED",
        message: `Invalid User Email: ${email}`,
        ip_address: req.ip
      });
      return res.status(401).json({ status: "error", message: "Invalid User Email" });
    }

    const payload = {
      data: [
        {
          Note_Title: bodyData.title || "Note",
          Note_Content: bodyData.note
        }
      ]
    };

    const response = await axios.post(
      `${BASE_URL}/${leadId}/Notes`,
      payload,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    // 🔥 Sync Lead via correct Zoho ID
    await updateLeadModifiedBy(leadId, zohoUserId, token, "CREATE_NOTE");

    logActivity({
      user_id: email,
      action: "CREATE_NOTE",
      module: "Notes",
      status: "SUCCESS",
      message: `Note created & Lead updated`,
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(err.response?.status || 500).json(
      err.response?.data || { message: err.message }
    );
  }
};


// ==============================
// UPDATE NOTE
// ==============================
const updateNote = async (req, res) => {
  try {
    const { leadId, noteId } = req.params;
    const bodyData = req.body;

    const email = validateJainsUser(bodyData);
    if (!leadId || !noteId || !email) {
      return res.status(400).json({
        status: "error",
        message: "Lead ID, Note ID and valid Jains_User.email required"
      });
    }

    if (!bodyData.note || bodyData.note.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Note content is required"
      });
    }

    const token = await getAccessToken();

    // Validate User and get lookup ID
    const zohoUserId = await getZohoUserIdByEmail(email, token);
    if (!zohoUserId) {
      logActivity({
        user_id: email,
        action: "UPDATE_NOTE",
        module: "Leads",
        status: "FAILED",
        message: `Invalid User Email: ${email}`,
        ip_address: req.ip
      });
      return res.status(401).json({ status: "error", message: "Invalid User Email" });
    }

    const payload = {
      data: [
        {
          id: noteId,
          Note_Title: bodyData.title,
          Note_Content: bodyData.note
        }
      ]
    };

    const response = await axios.put(
      `${BASE_URL}/${leadId}/Notes`,
      payload,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    // 🔥 Sync Lead via correct Zoho ID
    await updateLeadModifiedBy(leadId, zohoUserId, token, "UPDATE_NOTE");

    logActivity({
      user_id: email,
      action: "UPDATE_NOTE",
      module: "Notes",
      status: "SUCCESS",
      message: `Note updated & Lead synced`,
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(err.response?.status || 500).json(
      err.response?.data || { message: err.message }
    );
  }
};


// ==============================
// DELETE NOTE
// ==============================
const deleteNote = async (req, res) => {
  try {
    const { leadId, noteId } = req.params;
    const bodyData = req.body;

    const email = validateJainsUser(bodyData);
    if (!leadId || !noteId || !email) {
      logActivity({
        user_id: email || "UNKNOWN",
        action: "DELETE_NOTE",
        module: "Notes",
        status: "FAILED",
        message: "Lead ID, Note ID and valid Jains_User.email required",
        ip_address: req.ip
      });
      return res.status(400).json({
        status: "error",
        message: "Lead ID, Note ID and valid Jains_User.email required"
      });
    }

    const token = await getAccessToken();

    // Validate User and get lookup ID
    const zohoUserId = await getZohoUserIdByEmail(email, token);
    if (!zohoUserId) {
      logActivity({
        user_id: email,
        action: "DELETE_NOTE",
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

    const response = await axios.delete(
      `${BASE_URL}/${leadId}/Notes/${noteId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`
        }
      }
    );

    // 🔥 Sync Lead via correct Zoho ID
    await updateLeadModifiedBy(leadId, zohoUserId, token, "DELETE_NOTE");

    logActivity({
      user_id: email,
      action: "DELETE_NOTE",
      module: "Notes",
      status: "SUCCESS",
      message: `Note deleted & Lead synced`,
      ip_address: req.ip
    });

    return res.status(200).json(response.data);

  } catch (err) {
    console.error(err.response?.data || err.message);
    logActivity({
      user_id: req.body?.Jains_User?.email || "UNKNOWN",
      action: "DELETE_NOTE",
      module: "Notes",
      status: "ERROR",
      message: JSON.stringify(err.response?.data || err.message),
      ip_address: req.ip
    });

    return res.status(err.response?.status || 500).json(
      err.response?.data || { message: err.message }
    );
  }
};


// ==============================
module.exports = {
  getNotes,
  createNote,
  updateNote,
  deleteNote
};