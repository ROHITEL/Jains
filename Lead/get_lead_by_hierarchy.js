const axios = require("axios");
const { getAccessToken } = require("../services/zohoAuth");
const logActivity = require("../utils/activityLogger");

// ==========================================
// Get Leads Based On User Hierarchy
// ==========================================
const searchLeadsByHierarchy = async (req, res) => {

  try {

    // ==========================================
    // Extract User ID
    // ==========================================
   const email = req.query.email;
let jainsUserId;
const bodyData = req.body;
    // ==========================================
    // Validation
    // ==========================================
    const missingFields = [];

    if (!email?.toString().trim()) {
      missingFields.push("email");
    }

    // ==========================================
    // Validation Failed
    // ==========================================
    if (missingFields.length > 0) {

      await logActivity({
        user_id: "UNKNOWN",
        action: "SEARCH_LEADS_HIERARCHY",
        module: "Leads",
        status: "FAILED",
        message: `${missingFields.join(", ")} missing`,
        ip_address: req.ip
      });

      return res.status(400).json({
        success: false,
        message: `${missingFields.join(", ")} field(s) mandatory`
      });
    }

    // ==========================================
    // Get Zoho Access Token
    // ==========================================
    const token = await getAccessToken();
    // ==========================================
// Validate Jains User Email
// ==========================================
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

  // Store Zoho User Record ID if needed
  const jainsUserId = zohoUser.id;

} catch (error) {

  await logActivity({
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

    // ==========================================
    // Recursive Function To Get Subordinates
    // ==========================================
    const getSubordinates = async (
      userId,
      collectedUsers = []
    ) => {

      collectedUsers.push(userId);

      // ==========================================
      // Search Child Users
      // ==========================================
      const childUsersResponse = await axios.get(
        `${process.env.ZOHO_DOMAIN}/crm/v8/Jains_User/search`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
          },
          params: {
            criteria: `(Jains_User_Reporting_To:equals:${userId})`,
            fields: "id,Name,Jains_User_Reporting_To"
          }
        }
      );

      const childUsers =
        childUsersResponse.data.data || [];

      // ==========================================
      // Recursive Loop
      // ==========================================
      for (const child of childUsers) {

        const childId = child.id;

        // Prevent Duplicates
        if (!collectedUsers.includes(childId)) {

          await getSubordinates(
            childId,
            collectedUsers
          );
        }
      }

      return collectedUsers;
    };

    // ==========================================
    // STEP 1 : Get Logged In User
    // ==========================================
const userResponse = await axios.get(
  `${process.env.ZOHO_DOMAIN}/crm/v8/Jains_User/search`,
  {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
    },
    params: {
      criteria: `(Email:equals:${email})`,
      fields:
        "id,Name,Email,Edit_User_Role,Jains_User_Reporting_To"
    }
  }
);

    const userData =
      userResponse.data.data?.[0];
       jainsUserId = userData?.id;

    // ==========================================
    // User Not Found
    // ==========================================
    if (!userData) {

      await logActivity({
        user_id: jainsUserId,
        action: "SEARCH_LEADS_HIERARCHY",
        module: "Leads",
        status: "FAILED",
        message: "User not found",
        ip_address: req.ip
      });

      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ==========================================
    // Role Field
    // ==========================================
    const userRole =
      userData.Edit_User_Role;

    // ==========================================
    // STEP 2 : Admin / SuperAdmin
    // ==========================================
    if (
      userRole === "Admin" ||
      userRole === "SuperAdmin"
    ) {

      const allLeadsResponse = await axios.get(
        `${process.env.ZOHO_DOMAIN}/crm/v8/Leads`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
          },
          params: {
            fields:
              "id,Last_Name,Company,Email,Phone,Jains_User"
          }
        }
      );

      const allLeads =
        allLeadsResponse.data.data || [];

      // ==========================================
      // Success Log
      // ==========================================
      await logActivity({
        user_id: jainsUserId,
        action: "SEARCH_LEADS_HIERARCHY",
        module: "Leads",
        status: "SUCCESS",
        message: `Admin fetched ${allLeads.length} leads`,
        ip_address: req.ip
      });

      return res.json({
        success: true,
        role: userRole,
        total: allLeads.length,
        leads: allLeads
      });
    }

    // ==========================================
    // STEP 3 : Get All Subordinate Users
    // ==========================================
    const allUserIds =
      await getSubordinates(jainsUserId);

    // ==========================================
    // STEP 4 : Get Leads For All Users
    // ==========================================
    let allLeads = [];

    for (const userId of allUserIds) {

      console.log(
        "Searching Leads For User:",
        userId
      );

      const leadResponse = await axios.get(
        `${process.env.ZOHO_DOMAIN}/crm/v8/Leads/search`,
        {
          headers: {
            Authorization:
              `Zoho-oauthtoken ${token}`,
          },
          params: {
            criteria:
              `(Jains_User.id:equals:${userId})`,
            fields:
              "id,Last_Name,Company,Email,Phone,Jains_User"
          }
        }
      );

      const leads =
        leadResponse.data.data || [];

      console.log(
        "Leads Found:",
        leads.length
      );

      allLeads.push(...leads);
    }

    // ==========================================
    // Success Log
    // ==========================================
    await logActivity({
      user_id: jainsUserId,
      action: "SEARCH_LEADS_HIERARCHY",
      module: "Leads",
      status: "SUCCESS",
      message:
        `Fetched ${allLeads.length} leads for ${allUserIds.length} users`,
      ip_address: req.ip
    });

    // ==========================================
    // Final Response
    // ==========================================
    return res.json({
      success: true,
      role: userRole,
      totalUsers: allUserIds.length,
      totalLeads: allLeads.length,
      userIds: allUserIds,
      leads: allLeads
    });

  } catch (err) {

    // ==========================================
    // Error Log
    // ==========================================
    await logActivity({
      user_id:
        req.query.email  || "UNKNOWN",
      action: "SEARCH_LEADS_HIERARCHY",
      module: "Leads",
      status: "ERROR",
      message:
        err.response?.data?.data?.[0]?.message ||
        err.message,
      ip_address: req.ip
    });

    console.log(
      err.response?.data || err.message
    );

    // ==========================================
    // Direct Zoho Error Response
    // ==========================================
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
  searchLeadsByHierarchy
};