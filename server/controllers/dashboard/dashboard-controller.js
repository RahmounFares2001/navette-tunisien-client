import mongoose from 'mongoose';
import { Transfer, ExcursionRequest } from '../../models/models.js';
import { verifyAdmin } from '../../utils/verifyAdmin.js';

// Get dashboard data
export const getDashboardData = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      // Get current date and start/end of today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch stats
      const activeTransfers = await Transfer.countDocuments({
        status: 'confirmed',
      });

      const activeExcursionRequests = await ExcursionRequest.countDocuments({
        status: 'confirmed',
      });

      const transfersToday = await Transfer.countDocuments({
        travelDate: { $gte: today, $lt: tomorrow },
      });

      const excursionsToday = await ExcursionRequest.countDocuments({
        excursionDate: { $gte: today, $lt: tomorrow },
      });

      // Fetch recent activities (latest 4 transfers or excursion requests)
      const recentTransfers = await Transfer.find()
        .select('clientName status createdAt')
        .sort({ createdAt: -1 })
        .limit(2)
        .lean();

      const recentExcursionRequests = await ExcursionRequest.find()
        .select('clientName status excursionId createdAt')
        .populate('excursionId', 'title')
        .sort({ createdAt: -1 })
        .limit(2)
        .lean();

      // Combine and format recent activities
      const recentActivities = [
        ...recentTransfers.map(transfer => ({
          type: 'transfer',
          message: `Nouveau transfert réservé par ${transfer.clientName}`,
          time: formatTimeAgo(transfer.createdAt),
          status: transfer.status,
        })),
        ...recentExcursionRequests.map(request => ({
          type: 'excursion',
          message: `Demande d'excursion ${request.excursionId?.title || 'personnalisée'} reçue de ${request.clientName}`,
          time: formatTimeAgo(request.createdAt),
          status: request.status,
        })),
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 4);

      // Stats object matching frontend structure
      const stats = [
        {
          title: 'Transferts Actives',
          value: activeTransfers.toString(),
          icon: 'Car',
        },
        {
          title: 'Excursions Actives',
          value: activeExcursionRequests.toString(),
          icon: 'MapPin',
        },
        {
          title: 'Transferts du Jour',
          value: transfersToday.toString(),
          icon: 'Car',
        },
        {
          title: 'Excursions du Jour',
          value: excursionsToday.toString(),
          icon: 'Clock',
        },
      ];

      res.json({
        success: true,
        data: {
          stats,
          recentActivities,
        },
        message: 'Données du tableau de bord récupérées avec succès',
      });
    } catch (err) {
      console.error('getDashboardData error:', err);
      res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
  });
};

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  if (diffInSeconds < 60) return `Il y a ${diffInSeconds} secondes`;
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} minutes`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} heures`;
  return `Il y a ${Math.floor(diffInSeconds / 86400)} jours`;
}