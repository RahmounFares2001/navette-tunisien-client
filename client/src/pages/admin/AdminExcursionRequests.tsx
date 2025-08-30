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
import ExcursionRequestModal from '@/components/admin/modals/ExcursionRequestModal';

interface ExcursionRequest {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  excursionTitle: string;
  numberOfPeople: number;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  message: string;
}

const AdminExcursionRequests = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExcursionRequest | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');

  // Mock data
  const excursionRequests: ExcursionRequest[] = [
    {
      id: '1',
      fullName: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      phone: '+33 6 12 34 56 78',
      excursionTitle: 'Carthage et Sidi Bou Saïd',
      numberOfPeople: 4,
      date: '2024-01-20',
      status: 'pending',
      totalPrice: 320,
      message: 'Nous aimerions visiter en fin d\'après-midi'
    },
    {
      id: '2',
      fullName: 'Amina Trabelsi',
      email: 'amina.trabelsi@email.com',
      phone: '+216 12 345 678',
      excursionTitle: 'Excursion dans le Sahara',
      numberOfPeople: 2,
      date: '2024-01-25',
      status: 'confirmed',
      totalPrice: 500,
      message: ''
    },
    {
      id: '3',
      fullName: 'Marco Rossi',
      email: 'marco.rossi@email.com',
      phone: '+39 123 456 789',
      excursionTitle: 'Kairouan - Ville Sainte',
      numberOfPeople: 6,
      date: '2024-01-18',
      status: 'completed',
      totalPrice: 720,
      message: 'Groupe famille avec enfants'
    },
    {
      id: '4',
      fullName: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 555 123 4567',
      excursionTitle: 'El Jem et Sousse',
      numberOfPeople: 3,
      date: '2024-01-22',
      status: 'pending',
      totalPrice: 300,
      message: 'Première visite en Tunisie'
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

  const filteredRequests = excursionRequests.filter(request => {
    const matchesSearch = request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.excursionTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddRequest = () => {
    setSelectedRequest(undefined);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleViewRequest = (request: ExcursionRequest) => {
    setSelectedRequest(request);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEditRequest = (request: ExcursionRequest) => {
    setSelectedRequest(request);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSaveRequest = (request: ExcursionRequest) => {
    console.log('Saving excursion request:', request);
    // In real app, would save to backend
  };

  const totalRevenue = filteredRequests.reduce((sum, request) => sum + request.totalPrice, 0);

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
              Demandes d'Excursions
            </h1>

          </div>
          <Button 
            onClick={handleAddRequest}
            className="bg-admin-foreground text-admin-bg hover:bg-gray-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une Demande
          </Button>
        </motion.div>


        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-admin-card border-dash2 rounded">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-muted" />
                    <Input
                      placeholder="Rechercher par nom, email ou excursion..."
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

        {/* Requests Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="bg-admin-card border-dash2 rounded">
            <CardHeader>
              <CardTitle className="text-admin-foreground">
                Demandes d'Excursions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-admin-border hover:bg-transparent">
                      <TableHead className="text-admin-foreground">Client</TableHead>
                      <TableHead className="text-admin-foreground hidden lg:table-cell">Excursion</TableHead>
                      <TableHead className="text-admin-foreground hidden sm:table-cell">Personnes</TableHead>
                      <TableHead className="text-admin-foreground">Date</TableHead>
                      <TableHead className="text-admin-foreground">Statut</TableHead>
                      <TableHead className="text-admin-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id} className="border-admin-border hover:bg-admin-bg/50">
                        <TableCell>
                          <div className="font-medium text-admin-foreground">
                            {request.fullName}
                          </div>
                          <div className="md:hidden text-xs text-admin-muted mt-1">
                            {request.email}
                          </div>
                        </TableCell>

                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm text-admin-foreground font-medium">
                            {request.excursionTitle}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-admin-foreground">
                            {request.numberOfPeople}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-admin-foreground">
                            {new Date(request.date).toLocaleDateString('fr-FR')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(request.status)}>
                            {getStatusText(request.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleViewRequest(request)}
                              className="text-gray-900 border-admin-border hover:bg-admin-bg"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditRequest(request)}
                              className="bg-yellow-600 hover:text-gray-900 border-admin-border hover:bg-bg-yellow-700"
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

        {/* Excursion Request Modal */}
        <ExcursionRequestModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          request={selectedRequest}
          mode={modalMode}
          onSave={handleSaveRequest}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminExcursionRequests;