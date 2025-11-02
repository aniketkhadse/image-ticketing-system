import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ticketAPI } from "../services/api";
import Toast from "../components/Toast";

function AdminDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await ticketAPI.getAllTickets();
      setTickets(response.data);
    } catch (error) {
      showToast("Failed to fetch tickets", "error");
    }
  };

  const fetchStats = async () => {
    try {
      const response = await ticketAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats");
    }
  };

  const handleStatusUpdate = async (ticketId, status, adminComment) => {
    setLoading(true);
    try {
      await ticketAPI.updateStatus(ticketId, { status, adminComment });
      showToast("Ticket updated successfully!", "success");
      fetchTickets();
      fetchStats();
    } catch (error) {
      showToast("Failed to update ticket", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;

    try {
      await ticketAPI.deleteTicket(ticketId);
      showToast("Ticket deleted successfully!", "success");
      fetchTickets();
      fetchStats();
    } catch (error) {
      showToast("Failed to delete ticket", "error");
    }
  };

  const handleBulkDeleteSolved = async () => {
    const solvedCount = tickets.filter((t) => t.status === "solved").length;

    if (solvedCount === 0) {
      showToast("No solved tickets to delete", "info");
      return;
    }

    if (
      !window.confirm(
        `Delete all ${solvedCount} solved tickets? This cannot be undone.`
      )
    )
      return;

    setLoading(true);
    try {
      const response = await ticketAPI.bulkDeleteSolved();
      showToast(response.data.message, "success");
      fetchTickets();
      fetchStats();
    } catch (error) {
      showToast("Failed to delete tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Path copied to clipboard!", "success");
  };

  const openFolder = (path) => {
    window.open(`file:///${path}`, "_blank");
  };

  const exportToCSV = () => {
    const csvData = tickets.map((t) => ({
      ID: t._id,
      Sender: t.senderName,
      Email: t.senderEmail,
      Path: t.folderPath,
      Query: t.query,
      Status: t.status,
      Date: new Date(t.createdAt).toLocaleString(),
    }));

    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map((row) => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    showToast("Tickets exported successfully!", "success");
  };

  const getFilteredTickets = () => {
    let filtered = tickets;

    switch (filter) {
      case "pending":
        filtered = filtered.filter((t) => t.status === "pending");
        break;
      case "solved":
        filtered = filtered.filter((t) => t.status === "solved");
        break;
      case "error":
        filtered = filtered.filter((t) => t.status === "error");
        break;
      case "newest":
        filtered = [...filtered].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case "oldest":
        filtered = [...filtered].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
      default:
        break;
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.senderEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.folderPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.query.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-blue-100 mt-1">
                Manage all tickets and system statistics
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition shadow"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Tickets"
              value={stats.totalTickets}
              icon="📊"
              color="bg-blue-500"
            />
            <StatCard
              title="Pending"
              value={stats.pendingTickets}
              icon="⏳"
              color="bg-yellow-500"
            />
            <StatCard
              title="Solved"
              value={stats.solvedTickets}
              icon="✅"
              color="bg-green-500"
            />
            <StatCard
              title="Errors"
              value={stats.errorTickets}
              icon="❌"
              color="bg-red-500"
            />
          </div>
        )}

        {/* Database Storage Info */}
        {stats && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Database Storage
                </h3>
                <p className="text-sm text-gray-600">
                  Using {stats.dbSize.mb} MB of {stats.dbSize.maxSize} MB (Free
                  Tier)
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-blue-600">
                  {stats.dbSize.percentage}%
                </span>
                <p className="text-xs text-gray-500">Used</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  parseFloat(stats.dbSize.percentage) > 80
                    ? "bg-red-500"
                    : parseFloat(stats.dbSize.percentage) > 60
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${stats.dbSize.percentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalUsers}
                </p>
                <p className="text-xs text-gray-600">Total Users</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-800">
                  {stats.recentTickets}
                </p>
                <p className="text-xs text-gray-600">Last 7 Days</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-800">
                  {stats.dbSize.bytes}
                </p>
                <p className="text-xs text-gray-600">Total Bytes</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-800">
                  {(512 - parseFloat(stats.dbSize.mb)).toFixed(2)} MB
                </p>
                <p className="text-xs text-gray-600">Remaining</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full lg:w-auto">
              <input
                type="text"
                placeholder="Search by name, email, path, or query..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 lg:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Tickets</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="pending">Pending</option>
                <option value="solved">Solved</option>
                <option value="error">Error</option>
              </select>

              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition whitespace-nowrap"
              >
                📥 Export CSV
              </button>

              <button
                onClick={handleBulkDeleteSolved}
                disabled={
                  loading ||
                  tickets.filter((t) => t.status === "solved").length === 0
                }
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                🗑️ Delete Solved (
                {tickets.filter((t) => t.status === "solved").length})
              </button>
            </div>
          </div>
        </div>

        {/* Tickets */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            All Tickets ({getFilteredTickets().length})
          </h2>

          {getFilteredTickets().length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No tickets found</p>
            </div>
          ) : (
            getFilteredTickets().map((ticket) => (
              <TicketCard
                key={ticket._id}
                ticket={ticket}
                onStatusUpdate={handleStatusUpdate}
                onDelete={handleDeleteTicket}
                onCopyPath={copyToClipboard}
                onOpenFolder={openFolder}
                loading={loading}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div
          className={`${color} w-14 h-14 rounded-full flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function TicketCard({
  ticket,
  onStatusUpdate,
  onDelete,
  onCopyPath,
  onOpenFolder,
  loading,
}) {
  const [status, setStatus] = useState(ticket.status);
  const [adminComment, setAdminComment] = useState(ticket.adminComment || "");
  const [expanded, setExpanded] = useState(false);

  const handleUpdate = () => {
    onStatusUpdate(ticket._id, status, adminComment);
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    solved: "bg-green-100 text-green-800 border-green-200",
    error: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                  statusColors[ticket.status]
                }`}
              >
                {ticket.status.toUpperCase()}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(ticket.createdAt).toLocaleDateString()} •{" "}
                {new Date(ticket.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {ticket.senderName}
            </h3>
            <p className="text-sm text-gray-600">{ticket.senderEmail}</p>
          </div>
          <button
            onClick={() => onDelete(ticket._id)}
            className="text-red-600 hover:text-red-800 transition p-2"
            title="Delete ticket"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Folder Path */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Folder Path
          </label>
          <div className="flex gap-2">
            <div
              onClick={() => onOpenFolder(ticket.folderPath)}
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-blue-600 hover:text-blue-800 cursor-pointer font-mono text-sm break-all"
            >
              {ticket.folderPath}
            </div>
            <button
              onClick={() => onCopyPath(ticket.folderPath)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
              title="Copy path"
            >
              📋
            </button>
          </div>
        </div>

        {/* Query */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Query
          </label>
          <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
            {ticket.query}
          </div>
        </div>

        {/* Expandable Admin Section */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition flex items-center justify-between"
        >
          <span>Update Ticket Status</span>
          <svg
            className={`w-5 h-5 transform transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {expanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Status Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="pending">Pending</option>
                <option value="solved">Solved</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Admin Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Comment
              </label>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                rows={3}
                placeholder="Add your comment here..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            {/* Update Button */}
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Ticket"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
