import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Edit, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/components/admin/AdminLayout';
import TransferModal from '@/components/admin/modals/TransferModal';

interface Transfer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  departure: string;
  destination: string;
  vehicle: string;
  travelDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

const AdminTransfers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');

  // Mock data
  const transfers: Transfer[] = [
    {
      id: '1',
      fullName: 'Marie Dubois',
      email: 'marie.dubois@email.com',
      phone: '+216 12 345 678',
      departure: 'Aéroport Tunis-Carthage',
      destination: 'Hôtel Laico Tunis',
      vehicle: 'Sedan Confort',
      travelDate: '2024-01-15',
      status: 'pending'
    },
    {
      id: '2',
      fullName: 'Ahmed Ben Ali',
      email: 'ahmed.benali@email.com',
      phone: '+216 98 765 432',
      departure: 'Hôtel Movenpick',
      destination: 'Aéroport Tunis-Carthage',
      vehicle: 'SUV Premium',
      travelDate: '2024-01-14',
      status: 'confirmed'
    },
    {
      id: '3',
      fullName: 'Sophie Martin',
      email: 'sophie.martin@email.com',
      phone: '+33 6 12 34 56 78',
      departure: 'Port de Tunis',
      destination: 'Sidi Bou Saïd',
      vehicle: 'Minibus',
      travelDate: '2024-01-13',
      status: 'completed'
    }
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-admin-muted text-admin-foreground';
      case 'confirmed': return 'bg-admin-foreground text-admin-bg';
      case 'completed': return 'bg-admin-accent text-admin-foreground';
      case 'cancelled': return 'bg-admin-border text-admin-muted';
      default: return 'bg-admin-muted text-admin-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En Attente';
      case 'confirmed': return 'Confirmé';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddTransfer = () => {
    setSelectedTransfer(undefined);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleViewTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEditTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSaveTransfer = (transfer: Transfer) => {
    console.log('Saving transfer:', transfer);
    // In real app, would save to backend
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
              Gestion des Transferts
            </h1>

          </div>
          <Button 
            onClick={handleAddTransfer}
            className="bg-admin-foreground text-gray-900 hover:bg-gray-300"
          >
            <Plus className="mr-2 h-4 w-4 text-gray-900" />
            Ajouter un Transfert
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-admin-card border-dash2 rounded">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-muted" />
                    <Input
                      placeholder="Rechercher par nom, email ou téléphone..."
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
                      <SelectItem value="pending">En Attente</SelectItem>
                      <SelectItem value="confirmed">Confirmé</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transfers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-admin-card border-dash2 rounded">
            <CardHeader>
              <CardTitle className="text-admin-foreground">
                Les Demandes de Transferts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-admin-border hover:bg-transparent">
                      <TableHead className="text-admin-foreground font-bold">Client</TableHead>
                      <TableHead className="text-admin-foreground hidden sm:table-cell font-bold">Véhicule</TableHead>
                      <TableHead className="text-admin-foreground font-bold">Date</TableHead>
                      <TableHead className="text-admin-foreground font-bold">Statut</TableHead>
                      <TableHead className="text-admin-foreground font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransfers.map((transfer) => (
                      <TableRow key={transfer.id} className="border-admin-border hover:bg-admin-bg/50">
                        <TableCell>
                          <div className="font-medium text-admin-foreground">
                            {transfer.fullName}
                          </div>
                          <div className="md:hidden text-xs text-admin-muted mt-1">
                            {transfer.email}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-admin-foreground">
                            {transfer.vehicle}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-admin-foreground">
                            {new Date(transfer.travelDate).toLocaleDateString('fr-FR')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(transfer.status)}>
                            {getStatusText(transfer.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right' >
                          <div className="flex space-x-1 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleViewTransfer(transfer)}
                              className="text-gray-900 border-admin-border hover:bg-admin-bg"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditTransfer(transfer)}
                              className="bg-yellow-600 hover:text-gray-900 text-admin-foreground border-admin-border hover:bg-yellow-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transfer Modal */}
        <TransferModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          transfer={selectedTransfer}
          mode={modalMode}
          onSave={handleSaveTransfer}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminTransfers;