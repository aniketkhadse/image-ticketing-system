const mongoose = require("mongoose");

// Comment sub-schema
const commentSchema = new mongoose.Schema({
  text: String,
  author: String,
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Main ticket schema
const ticketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderEmail: {
      type: String,
      required: true,
    },
    folderPath: {
      type: String,
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "solved", "error"],
      default: "pending",
    },
    adminComment: {
      type: String,
      default: "",
    },
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

// Export model
const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
