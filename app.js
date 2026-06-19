/**
* This app acts as an interface between Zoho CRM Leads and Jains Connect App
* Date :06/05/2026
* Version :1.0
* Author : Rohit, CubeYogi 
**/
require("dotenv").config();
const authenticate = require("./middleware/auth");
const express = require("express");



const { getLeads, getLeadById } = require("./Lead/get_lead");
const { updateLead } = require("./Lead/update");
const { createLead } = require("./Lead/create_lead");
const {deleteLeadById,deleteLeadsByIds} = require("./Lead/delete_lead");
const { getDeletedLeads } = require("./Lead/deleted_leads");
const { getLeadCount } = require("./Lead/lead_count");
const { getLeadTimeline } = require("./Lead/timeline");
const { searchByField } = require("./Lead/search_by_field");
const { searchByCriteria } = require("./Lead/search_by_criteria");
const { getAttachments,getAttachmentById,uploadAttachment,deleteAttachment} = require("./Lead/attachments");
const {createuser} = require("./User/create_user");
const {updateUser} = require("./User/update_user");
const { deleteUserById } = require("./User/delete_user");
const {searchLeadsByJainsUsers} = require("./Lead/get_lead_by_jains_users");
const {searchLeadsByJainsUser} = require("./Lead/get_lead_by_jains_user");
const {getNotes,createNote,updateNote,deleteNote} = require("./Lead/notes");
const { getusers, getUserByEmail } = require("./User/get_users");

const app = express();

app.use(express.json()); //  IMPORTANT
app.use(authenticate);
// Lead APIs
app.get("/getLeads", getLeads);
app.get("/getLeadById/:id", getLeadById);
app.put("/updateLead/:id", updateLead);
app.post("/createLead", createLead);
app.delete("/deleteLeadById/:id", deleteLeadById);
app.delete("/deleteLeads", deleteLeadsByIds);
app.get("/deletedLeads", getDeletedLeads);
app.get("/leadCount", getLeadCount);
app.get("/leadTimeline/:id", getLeadTimeline);
app.get("/searchLeads", searchByField);
app.get("/searchByCriteria", searchByCriteria);

// Attachment APIs
app.get("/lead/:id/attachments", getAttachments);
app.get("/lead/:leadId/attachments/:attachmentId", getAttachmentById);
app.post("/lead/:id/attachments", uploadAttachment);
app.delete("/lead/:leadId/attachments/:attachmentId", deleteAttachment);

// User APIs
app.post("/user/create", createuser);
app.put("/user/update/:id", updateUser);
app.delete("/user/delete/:id", deleteUserById);
app.get("/getLeadByJainsUsers", searchLeadsByJainsUsers);
app.get("/getLeadByJainsUser", searchLeadsByJainsUser);
app.get("/getusers", getusers);
app.get("/getUserByEmail", getUserByEmail);
// Notes APIs
app.get("/lead/:id/notes", getNotes);
app.post("/lead/:id/notes", createNote);
app.put("/lead/:leadId/notes/:noteId", updateNote);
app.delete("/lead/:leadId/notes/:noteId", deleteNote);

app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
});
