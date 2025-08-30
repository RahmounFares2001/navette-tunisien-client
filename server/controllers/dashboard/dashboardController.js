import mongoose from "mongoose";
import { User, Car, Reservation } from "../../models/models.js";

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total Vehicles
    const totalVehicles = await Car.countDocuments();

    // Total Clients
    const totalClients = await User.countDocuments();

    // Active Clients (users with confirmed or paid reservations in the last 30 days)
    const activeClients = await Reservation.distinct("user", {
      status: { $in: ["confirmed", "paid"] },
      pickupDate: { $gte: thirtyDaysAgo },
    }).then((userIds) => userIds.length);

    // Ongoing Rentals (confirmed or paid reservations where current date is between pickup and dropoff)
    const ongoingRentals = await Reservation.countDocuments({
      status: { $in: ["confirmed"] },
      pickupDate: { $lte: now },
      dropoffDate: { $gte: now },
    });

    // Popular Vehicles (top 4 cars by reservation count)
    const popularVehicles = await Reservation.aggregate([
      { $match: { status: { $in: ["confirmed"] } } },
      { $group: { _id: "$car", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 },
      {
        $lookup: {
          from: "cars",
          localField: "_id",
          foreignField: "_id",
          as: "car",
        },
      },
      { $unwind: "$car" },
      {
        $project: {
          nom: { $concat: ["$car.brand", " ", "$car.model"] },
          locations: "$count",
        },
      },
    ]);

    // Recent Activity (last 4 reservation-related actions)
    const recentActivity = await Reservation.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("user", "fullName")
      .populate("car", "brand model")
      .lean()
      .then((reservations) =>
        reservations.map((res) => ({
          action:
            res.status === "confirmed"?
               "Nouvelle location"
              : res.status === "paid" ?
               "Location payée" :
               res.status === "cancelled"?
               "Location annulée" :
                res.status === "rejected"?
                "Location rejetée" :
                res.status === "completed"?
                "Location complété" :
                "Location en attente",
          client: res.user?.fullName || "N/A",
          vehicule: res.car ? `${res.car.brand} ${res.car.model}` : "-",
          time: formatTimeAgo(res.createdAt),
        }))
      );

    // Helper function to format time ago
    function formatTimeAgo(date) {
      const now = new Date();
      const diffMs = now - new Date(date);
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffHours < 1) return "Il y a quelques minutes";
      if (diffHours < 24) return `Il y a ${diffHours}h`;
      if (diffDays === 1) return "Hier";
      return new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    res.json({
      success: true,
      data: {
        totalVehicles,
        totalClients,
        activeClients,
        ongoingRentals,
        popularVehicles,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};