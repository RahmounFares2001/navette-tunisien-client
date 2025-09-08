import { ExcursionRequest, Transfer } from "../../models/models.js";

// Cron job to update transfer and excursion request statuses
export const updateStatuses = async (req, res) => {
  try {
    const now = new Date();

    // Handle transfers: set status to 'completed' for travelDate before today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const expiredTransfers = await Transfer.find({
      status: { $in: ['pending', 'confirmed'] },
      travelDate: { $lte: yesterday },
    });

    for (const transfer of expiredTransfers) {
      transfer.status = 'completed';
      await transfer.save();
    }

    // Handle excursion requests: set status to 'completed' for excursionDate and excursionTime before now
    const expiredExcursionRequests = await ExcursionRequest.find({
      status: { $in: ['pending', 'confirmed'] },
    });

    for (const request of expiredExcursionRequests) {
      // Combine excursionDate and excursionTime into a full datetime
      const [hours, minutes] = request.excursionTime.split(':').map(Number);
      const excursionDateTime = new Date(request.excursionDate);
      excursionDateTime.setHours(hours, minutes, 0, 0);

      // Check if excursionDateTime is in the past
      if (excursionDateTime < now) {
        request.status = 'completed';
        await request.save();
      }
    }
    res.status(200).json({
      message: 'Tâche quotidienne exécutée avec succès',
      currentPage: 1,
      totalPages: 1,
    });
  } catch (error) {
    console.error('Erreur dans la tâche quotidienne:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};