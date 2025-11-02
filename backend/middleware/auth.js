const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    console.log("Auth Header:", authHeader ? "Present" : "Missing");

    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ message: "No authentication token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded:", {
      userId: decoded.userId,
      isAdmin: decoded.isAdmin,
    });

    req.userId = decoded.userId;
    req.isAdmin = decoded.isAdmin;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    console.log("Admin Auth Header:", authHeader ? "Present" : "Missing");

    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      console.log("No admin token provided");
      return res.status(401).json({ message: "No authentication token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Admin token decoded:", {
      userId: decoded.userId,
      isAdmin: decoded.isAdmin,
    });

    if (!decoded.isAdmin) {
      console.log("User is not admin");
      return res.status(403).json({ message: "Admin access required" });
    }

    req.userId = decoded.userId;
    req.isAdmin = decoded.isAdmin;

    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { auth, adminAuth };
