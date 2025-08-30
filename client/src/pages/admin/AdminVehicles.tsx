import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Edit, Trash2, Filter, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/admin/AdminLayout';
import VehicleModal from '@/components/admin/modals/VehicleModal';
import transferVehicle from '@/assets/transfer-vehicle.jpg';

interface Vehicle {
  id: string;
  name: string;
  seats: number;
  photo: string;
  status: 'available' | 'unavailable' | 'maintenance';
  bookings: number;
  lastService: string;
}

const AdminVehicles = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');

  // Mock data
  const vehicles: Vehicle[] = [
    {
      id: '1',
      name: 'Sedan Confort',
      seats: 4,
      photo: transferVehicle,
      status: 'available',
      bookings: 45,
      lastService: '2024-01-10'
    },
    {
      id: '2',
      name: 'SUV Premium',
      seats: 7,
      photo: transferVehicle,
      status: 'available',
      bookings: 38,
      lastService: '2024-01-08'
    },
    {
      id: '3',
      name: 'Minibus Familial',
      seats: 16,
      photo: transferVehicle,
      status: 'available',
      bookings: 22,
      lastService: '2024-01-05'
    },
    {
      id: '4',
      name: 'Bus Grand Confort',
      seats: 50,
      photo: transferVehicle,
      status: 'maintenance',
      bookings: 15,
      lastService: '2024-01-12'
    },
    {
      id: '5',
      name: 'Van Luxe',
      seats: 8,
      photo: transferVehicle,
      status: 'available',
      bookings: 31,
      lastService: '2024-01-07'
    },
    {
      id: '6',
      name: 'Microbus',
      seats: 12,
      photo: transferVehicle,
      status: 'unavailable',
      bookings: 18,
      lastService: '2024-01-09'
    }
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-admin-foreground text-admin-bg';
      case 'unavailable': return 'bg-admin-muted text-admin-foreground';
      case 'maintenance': return 'bg-admin-border text-admin-muted';
      default: return 'bg-admin-muted text-admin-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'unavailable': return 'Indisponible';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCapacity = filteredVehicles.reduce((sum, vehicle) => sum + vehicle.seats, 0);
  const availableVehicles = filteredVehicles.filter(v => v.status === 'available').length;

  const handleAddVehicle = () => {
    setSelectedVehicle(undefined);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSaveVehicle = (vehicle: Vehicle) => {
    console.log('Saving vehicle:', vehicle);
    // In real app, would save to backend
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    console.log('Deleting vehicle:', vehicle);
    // In real app, would delete from backend
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-admin-foreground">
              Gestion des Véhicules
            </h1>
            <p className="text-admin-muted mt-2">
              Gérez votre flotte de véhicules
            </p>
          </div>
          <Button 
            onClick={handleAddVehicle}
            className="bg-admin-foreground text-admin-bg hover:bg-admin-muted hover:text-admin-bg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un Véhicule
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="admin-card">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-admin-foreground">
                  {filteredVehicles.length}
                </p>
                <p className="text-sm text-admin-muted">Total Véhicules</p>
              </div>
            </CardContent>
          </Card>
          <Card className="admin-card">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-admin-foreground">
                  {availableVehicles}
                </p>
                <p className="text-sm text-admin-muted">Disponibles</p>
              </div>
            </CardContent>
          </Card>
          <Card className="admin-card">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-admin-foreground">
                  {totalCapacity}
                </p>
                <p className="text-sm text-admin-muted">Capacité Totale</p>
              </div>
            </CardContent>
          </Card>
          <Card className="admin-card">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-admin-foreground">
                  {filteredVehicles.reduce((sum, v) => sum + v.bookings, 0)}
                </p>
                <p className="text-sm text-admin-muted">Total Réservations</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="admin-card">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-muted" />
                    <Input
                      placeholder="Rechercher par nom de véhicule..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-admin-bg border-admin-border text-admin-foreground"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-admin-bg border-admin-border text-admin-foreground">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les Statuts</SelectItem>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="unavailable">Indisponible</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
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
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="admin-card">
                <CardContent className="p-6">
                  <div className="relative mb-4">
                    <img
                      src={vehicle.photo}
                      alt={vehicle.name}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={getStatusBadgeColor(vehicle.status)}>
                        {getStatusText(vehicle.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-admin-foreground text-lg">
                        {vehicle.name}
                      </h3>
                      <div className="flex items-center text-admin-muted">
                        <Car className="h-4 w-4 mr-1" />
                        <span className="text-sm">{vehicle.seats} places</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-admin-muted">
                      <span>Réservations: {vehicle.bookings}</span>
                      <span>Service: {new Date(vehicle.lastService).toLocaleDateString('fr-FR')}</span>
                    </div>
                    
                    <div className="flex space-x-2 pt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewVehicle(vehicle)}
                        className="flex-1 text-admin-foreground border-admin-border hover:bg-admin-accent"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditVehicle(vehicle)}
                        className="text-admin-foreground border-admin-border hover:bg-admin-accent"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteVehicle(vehicle)}
                        className="text-admin-muted border-admin-border hover:bg-admin-accent hover:text-admin-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Maintenance Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="text-admin-foreground">
                Prochaines Maintenances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicles
                  .filter(v => v.status === 'maintenance' || 
                    new Date(v.lastService) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                  .map((vehicle) => (
                    <div key={`maintenance-${vehicle.id}`} className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Car className="h-5 w-5 text-admin-muted" />
                        <div>
                          <p className="font-medium text-admin-foreground">{vehicle.name}</p>
                          <p className="text-sm text-admin-muted">
                            Dernier service: {new Date(vehicle.lastService).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-admin-muted text-admin-foreground">
                        {vehicle.status === 'maintenance' ? 'En cours' : 'Planifiée'}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vehicle Modal */}
        <VehicleModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          vehicle={selectedVehicle}
          mode={modalMode}
          onSave={handleSaveVehicle}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminVehicles;