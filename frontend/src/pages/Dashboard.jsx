import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ticketAPI } from "../services/api";
import Toast from "../components/Toast";

function Dashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [formData, setFormData] = useState({ folderPath: "", query: "" });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await ticketAPI.getMyTickets();
      setTickets(response.data);
    } catch (error) {
      showToast("Failed to fetch tickets", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await ticketAPI.create(formData);
      showToast("Ticket submitted successfully!", "success");
      setFormData({ folderPath: "", query: "" });
      fetchTickets();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to submit ticket",
        "error"
      );
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

  const openFolder = (path) => {
    window.open(`file:///${path}`, "_blank");
  };

  const getFilteredTickets = () => {
    let filtered = tickets;

    // Apply status filter
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

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.folderPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.query.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    solved: "bg-green-100 text-green-800 border-green-200",
    error: "bg-red-100 text-red-800 border-red-200",
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
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.name}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Ticket Submission Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Submit New Ticket
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Folder Path (L: Drive)
              </label>
              <input
                type="text"
                placeholder="e.g., L:\projects\images\batch1"
                value={formData.folderPath}
                onChange={(e) =>
                  setFormData({ ...formData, folderPath: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enhancement Requirements
              </label>
              <textarea
                placeholder="Describe your image enhancement requirements..."
                value={formData.query}
                onChange={(e) =>
                  setFormData({ ...formData, query: e.target.value })
                }
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition transform hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Tickets</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="pending">Pending</option>
              <option value="solved">Solved</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        {/* Tickets */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            My Tickets ({getFilteredTickets().length})
          </h2>

          {getFilteredTickets().length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No tickets found</p>
            </div>
          ) : (
            getFilteredTickets().map((ticket) => (
              <div
                key={ticket._id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
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
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Folder Path:
                    </span>
                    <div
                      onClick={() => openFolder(ticket.folderPath)}
                      className="mt-1 text-blue-600 hover:text-blue-800 cursor-pointer font-mono text-sm break-all"
                    >
                      {ticket.folderPath}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Requirements:
                    </span>
                    <p className="mt-1 text-gray-600">{ticket.query}</p>
                  </div>

                  {ticket.adminComment && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <span className="text-sm font-medium text-blue-900">
                        Admin Response:
                      </span>
                      <p className="mt-1 text-blue-800">
                        {ticket.adminComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
