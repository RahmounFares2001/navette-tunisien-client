import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AdminLayout from '@/components/admin/AdminLayout';
import AddVehicleModal from '@/components/admin/modals/vehicle/AddVehicleModal';
import UpdateVehicleModal from '@/components/admin/modals/vehicle/UpdateVehicleModal';
import { useGetAllVehiclesQuery, useDeleteVehicleMutation } from '@/globalRedux/features/api/apiSlice';
import { IVehicleResponse } from '@/types/types';
import { toast } from 'react-toastify';

const AdminVehicles = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<IVehicleResponse | undefined>(undefined);
  const [vehicleToDelete, setVehicleToDelete] = useState<IVehicleResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [vehicles, setVehicles] = useState<IVehicleResponse[]>([]);

  const { data: vehiclesData, isLoading } = useGetAllVehiclesQuery({ page: currentPage, limit: 10, search: searchTerm }, { skip: !isMounted, pollingInterval: 30000 });
  const [deleteVehicle] = useDeleteVehicleMutation();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (vehiclesData?.data) {
      setVehicles(vehiclesData.data.map(vehicle => ({
        ...vehicle,
        imgUrl: `${vehicle.imgUrl}?t=${Date.now()}`
      })));
    }
  }, [vehiclesData]);

  const totalPages = Math.min(vehiclesData?.totalPages || 1, 5);

  const getStatusBadgeColor = (status: boolean) => {
    return status ? 'bg-green-700 text-white' : 'bg-gray-300 text-black';
  };

  const getStatusText = (status: boolean) => {
    return status ? 'Disponible' : 'Indisponible';
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'available' && vehicle.isAvailable) || (statusFilter === 'unavailable' && !vehicle.isAvailable);
    return matchesSearch && matchesStatus;
  });

  const handleAddVehicle = () => {
    setAddModalOpen(true);
  };

  const handleEditVehicle = (vehicle: IVehicleResponse) => {
    setSelectedVehicle(vehicle);
    setUpdateModalOpen(true);
  };

  const handleDeleteVehicle = (vehicle: IVehicleResponse) => {
    setVehicleToDelete(vehicle);
    setDeleteModalOpen(true);
  };

  const confirmDeleteVehicle = async () => {
    if (vehicleToDelete) {
      try {
        await deleteVehicle(vehicleToDelete._id).unwrap();
        setVehicles(vehicles.filter(v => v._id !== vehicleToDelete._id));
        toast.success('Véhicule supprimé avec succès', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } catch (error) {
        console.error('Failed to delete vehicle:', error);
        toast.error('Échec de la suppression du véhicule', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      }
    }
    setDeleteModalOpen(false);
    setVehicleToDelete(null);
  };

  const handleSaveVehicle = (updatedVehicle?: IVehicleResponse) => {
    if (updatedVehicle) {
      setVehicles(prevVehicles => prevVehicles.map(v => v._id === updatedVehicle._id ? { ...updatedVehicle, imgUrl: `${updatedVehicle.imgUrl}?t=${Date.now()}` } : v));
    }
    setAddModalOpen(false);
    setUpdateModalOpen(false);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setPageInput('');
    }
  };

  const handlePageInputSubmit = () => {
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setPageInput('');
    }
  };

  if (!isMounted || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-admin-foreground">Chargement...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between"
          >
            <h1 className="text-3xl font-bold text-admin-foreground">
              Gestion des Véhicules
            </h1>
            <Button 
              onClick={handleAddVehicle}
              className="bg-admin-foreground text-admin-bg hover:bg-gray-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="bg-admin-card border-admin-border">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-muted" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div className="w-full sm:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="unavailable">Indisponible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Vehicles Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle._id} className="bg-admin-card border-admin-border">
                  <CardContent className="p-4">
                    <div className="relative mb-3">
                      <img
                        src={`${import.meta.env.VITE_API_IMG}${vehicle.imgUrl}`}
                        alt={vehicle.name}
                        className="w-full h-32 object-cover rounded-md"
                        onError={(e) => console.error(`Failed to load image for ${vehicle.name}: ${import.meta.env.VITE_API_IMG}${vehicle.imgUrl}`)}
                      />
                      <Badge className={`absolute top-2 right-2 ${getStatusBadgeColor(vehicle.isAvailable)}`}>
                        {getStatusText(vehicle.isAvailable)}
                      </Badge>
                    </div>
                    <div className='flex justify-between' >
                      <h3 className="font-semibold text-lg text-admin-foreground">{vehicle.name}</h3>
                      <p className="text-sm text-gray-100">{vehicle.numberOfSeats} places</p>
                    </div>
                    <div className="flex space-x-2 pt-3 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditVehicle(vehicle)}
                        className="bg-yellow-600 hover:text-gray-900 text-admin-foreground border-admin-border hover:bg-yellow-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteVehicle(vehicle)}
                        className="bg-red-700 text-gray-100 hover:text-gray-100 border-admin-border hover:bg-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Pagination */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center space-x-2"
          >
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-admin-bg text-admin-foreground hover:bg-gray-300 border-admin-border"
            >
              Précédent
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                onClick={() => handlePageChange(page)}
                className={currentPage === page ? 'bg-admin-foreground text-admin-bg' : 'bg-admin-bg text-admin-foreground hover:bg-gray-300 border-admin-border'}
              >
                {page}
              </Button>
            ))}
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-admin-bg text-admin-foreground hover:bg-gray-300 border-admin-border"
            >
              Suivant
            </Button>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Page"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="w-20 bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
              />
              <Button
                onClick={handlePageInputSubmit}
                className="bg-admin-foreground text-admin-bg hover:bg-gray-300"
              >
                Go
              </Button>
            </div>
          </motion.div>

          {/* Modals */}
          <AddVehicleModal
            open={addModalOpen}
            onOpenChange={setAddModalOpen}
            onSave={handleSaveVehicle}
          />
          <UpdateVehicleModal
            open={updateModalOpen}
            onOpenChange={setUpdateModalOpen}
            vehicle={selectedVehicle}
            onSave={handleSaveVehicle}
          />

          <Dialog open={deleteModalOpen} onOpenChange={() => setDeleteModalOpen(false)}>
            <DialogContent className="max-w-md bg-admin-card border-admin-border">
              <DialogHeader>
                <DialogTitle className="text-admin-foreground text-xl font-bold">
                  Confirmer la Suppression
                </DialogTitle>
                <DialogDescription className="text-admin-foreground">
                  Êtes-vous sûr de vouloir supprimer le véhicule ? Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                  className="text-gray-900 border-admin-border"
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmDeleteVehicle}
                  className="bg-red-700 text-gray-100 hover:bg-red-800"
                >
                  Supprimer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminVehicles;