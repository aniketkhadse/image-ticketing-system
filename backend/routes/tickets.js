const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { auth, adminAuth } = require("../middleware/auth");
const { sendEmail } = require("../config/email");

// Create Ticket
router.post("/", auth, async (req, res) => {
  try {
    console.log("=== CREATE TICKET REQUEST ===");
    console.log("User ID:", req.userId);
    console.log("Request Body:", req.body);

    const { folderPath, query } = req.body;

    if (!folderPath || !query) {
      console.log("Validation failed: Missing folderPath or query");
      return res
        .status(400)
        .json({ message: "Folder path and query are required" });
    }

    console.log("Finding user...");
    const user = await User.findById(req.userId);

    if (!user) {
      console.log("User not found:", req.userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user.name, user.email);
    console.log("Creating ticket...");

    const ticket = new Ticket({
      userId: req.userId,
      senderName: user.name,
      senderEmail: user.email,
      folderPath,
      query,
      status: "pending",
    });

    console.log("Saving ticket...");
    await ticket.save();
    console.log("Ticket saved successfully:", ticket._id);

    // Send email to admin
    try {
      console.log("Sending email to admin...");
      const adminEmail = process.env.ADMIN_EMAIL;

      if (adminEmail) {
        await sendEmail(
          adminEmail,
          `New Ticket from ${user.name}`,
          `
            <h2>New Ticket Notification</h2>
            <p><strong>From:</strong> ${user.name} (${user.email})</p>
            <p><strong>Folder Path:</strong> ${folderPath}</p>
            <p><strong>Query:</strong> ${query}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          `,
          user.name
        );
      }
    } catch (emailError) {
      console.error("Email sending failed (non-critical):", emailError.message);
    }

    console.log("=== TICKET CREATED SUCCESSFULLY ===");
    res.status(201).json({ message: "Ticket created successfully", ticket });
  } catch (error) {
    console.error("=== CREATE TICKET ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get User Tickets
router.get("/my-tickets", auth, async (req, res) => {
  try {
    console.log("Fetching tickets for user:", req.userId);
    const tickets = await Ticket.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    console.log("Found tickets:", tickets.length);
    res.json(tickets);
  } catch (error) {
    console.error("Get Tickets Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get All Tickets (Admin)
router.get("/all", adminAuth, async (req, res) => {
  try {
    console.log("Admin fetching all tickets");
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    console.log("Found tickets:", tickets.length);
    res.json(tickets);
  } catch (error) {
    console.error("Get All Tickets Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update Ticket Status (Admin)
router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    console.log("=== UPDATE TICKET STATUS ===");
    console.log("Ticket ID:", req.params.id);
    console.log("Update data:", req.body);

    const { status, adminComment } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      console.log("Ticket not found");
      return res.status(404).json({ message: "Ticket not found" });
    }

    console.log("Current ticket status:", ticket.status);

    ticket.status = status;
    if (adminComment) {
      ticket.adminComment = adminComment;
    }

    await ticket.save();
    console.log("Ticket updated successfully");

    // Send email to user
    try {
      const emailSubject =
        status === "solved"
          ? "Your Ticket Has Been Resolved"
          : "Update on Your Ticket";

      console.log("Sending email to:", ticket.senderEmail);
      await sendEmail(
        ticket.senderEmail,
        emailSubject,
        `
          <h2>Ticket Status Update</h2>
          <p><strong>Ticket ID:</strong> ${ticket._id}</p>
          <p><strong>Status:</strong> ${status.toUpperCase()}</p>
          <p><strong>Your Query:</strong> ${ticket.query}</p>
          ${
            adminComment
              ? `<p><strong>Admin Comment:</strong> ${adminComment}</p>`
              : ""
          }
          <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
        `,
        "Admin"
      );
      console.log("Email sent to user");
    } catch (emailError) {
      console.error("Email sending failed (non-critical):", emailError.message);
    }

    res.json({ message: "Ticket updated successfully", ticket });
  } catch (error) {
    console.error("Update Ticket Error:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add Comment
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const user = await User.findById(req.userId);

    ticket.comments.push({
      text,
      author: user.name,
      isAdmin: user.isAdmin,
    });

    await ticket.save();
    res.json({ message: "Comment added", ticket });
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete Single Ticket (Admin)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    console.log("Deleting ticket:", req.params.id);
    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    console.log("Ticket deleted successfully:", req.params.id);
    res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Delete Ticket Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Bulk Delete Solved Tickets (Admin)
router.post("/bulk-delete", adminAuth, async (req, res) => {
  try {
    console.log("Bulk deleting solved tickets...");
    const result = await Ticket.deleteMany({ status: "solved" });
    console.log(`Deleted ${result.deletedCount} solved tickets`);
    res.json({
      message: `${result.deletedCount} solved tickets deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk Delete Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Dashboard Statistics (Admin)
router.get("/stats/dashboard", adminAuth, async (req, res) => {
  try {
    console.log("Fetching dashboard statistics...");

    const totalTickets = await Ticket.countDocuments();
    const pendingTickets = await Ticket.countDocuments({ status: "pending" });
    const solvedTickets = await Ticket.countDocuments({ status: "solved" });
    const errorTickets = await Ticket.countDocuments({ status: "error" });

    const tickets = await Ticket.find().lean();
    const dbSizeBytes = JSON.stringify(tickets).length;
    const dbSizeMB = (dbSizeBytes / (1024 * 1024)).toFixed(2);

    const totalUsers = await User.countDocuments({ isAdmin: false });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTickets = await Ticket.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const stats = {
      totalTickets,
      pendingTickets,
      solvedTickets,
      errorTickets,
      totalUsers,
      recentTickets,
      dbSize: {
        mb: dbSizeMB,
        bytes: dbSizeBytes,
        maxSize: "512",
        percentage: ((parseFloat(dbSizeMB) / 512) * 100).toFixed(2),
      },
    };

    console.log("Statistics fetched successfully");
    res.json(stats);
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
