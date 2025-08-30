import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/components/admin/AdminLayout';
import ExcursionModal from '@/components/admin/modals/ExcursionModal';

interface Excursion {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  status: 'active' | 'inactive';
  bookings: number;
}

const AdminExcursions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExcursion, setSelectedExcursion] = useState<Excursion | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');

  // Mock data
  const excursions: Excursion[] = [
    {
      id: '1',
      title: 'Carthage et Sidi Bou Saïd',
      description: 'Découvrez les ruines antiques de Carthage et le charme de Sidi Bou Saïd',
      duration: '6 heures',
      price: 80,
      status: 'active',
      bookings: 24
    },
    {
      id: '2',
      title: 'Excursion dans le Sahara',
      description: 'Aventure inoubliable dans le désert tunisien avec nuit sous les étoiles',
      duration: '2 jours',
      price: 250,
      status: 'active',
      bookings: 18
    },
    {
      id: '3',
      title: 'Kairouan - Ville Sainte',
      description: 'Explorez la première capitale de la Tunisie musulmane et ses mosquées',
      duration: '8 heures',
      price: 120,
      status: 'active',
      bookings: 15
    },
    {
      id: '4',
      title: 'El Jem et Sousse',
      description: 'Amphithéâtre romain d\'El Jem et la médina historique de Sousse',
      duration: '10 heures',
      price: 100,
      status: 'inactive',
      bookings: 8
    },
    {
      id: '5',
      title: 'Dougga - Site Archéologique',
      description: 'Le mieux préservé des sites romains en Afrique du Nord',
      duration: '7 heures',
      price: 90,
      status: 'active',
      bookings: 12
    },
    {
      id: '6',
      title: 'Hammamet et Nabeul',
      description: 'Plages magnifiques et artisanat traditionnel de poterie',
      duration: '5 heures',
      price: 70,
      status: 'active',
      bookings: 20
    }
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-admin-foreground text-admin-bg';
      case 'inactive': return 'bg-admin-muted text-admin-foreground';
      default: return 'bg-admin-muted text-admin-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      default: return status;
    }
  };

  const filteredExcursions = excursions.filter(excursion => {
    const matchesSearch = excursion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         excursion.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || excursion.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filteredExcursions.reduce((sum, excursion) => 
    sum + (excursion.price * excursion.bookings), 0
  );

  const handleAddExcursion = () => {
    setSelectedExcursion(undefined);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleViewExcursion = (excursion: Excursion) => {
    setSelectedExcursion(excursion);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEditExcursion = (excursion: Excursion) => {
    setSelectedExcursion(excursion);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSaveExcursion = (excursion: Excursion) => {
    console.log('Saving excursion:', excursion);
    // In real app, would save to backend
  };

  const handleDeleteExcursion = (excursion: Excursion) => {
    console.log('Deleting excursion:', excursion);
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
              Gestion des Excursions
            </h1>

          </div>
          <Button 
            onClick={handleAddExcursion}
            className="bg-admin-foreground text-admin-bg hover:bg-gray-300 hover:text-admin-bg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une Excursion
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
                      placeholder="Rechercher par titre ou description..."
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
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Excursions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="bg-admin-card border-dash2 rounded">
            <CardHeader>
              <CardTitle className="text-admin-foreground">
                Excursions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-admin-border hover:bg-transparent">
                      <TableHead className="text-admin-foreground">Titre</TableHead>
                      <TableHead className="text-admin-foreground hidden sm:table-cell">Durée</TableHead>
                      <TableHead className="text-admin-foreground">Prix</TableHead>
                      <TableHead className="text-admin-foreground">Statut</TableHead>
                      <TableHead className="text-admin-foreground text-right pr-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExcursions.map((excursion) => (
                      <TableRow key={excursion.id} className="border-admin-border hover:bg-admin-bg/50">
                        <TableCell>
                          <div className="font-medium text-admin-foreground">
                            {excursion.title}
                          </div>
                          <div className="lg:hidden text-xs text-admin-muted mt-1 max-w-xs truncate">
                            {excursion.description}
                          </div>
                        </TableCell>

                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-admin-foreground">
                            {excursion.duration}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-admin-foreground">
                            {excursion.price} DT
                          </span>
                          <div className="sm:hidden text-xs text-admin-muted">
                            {excursion.duration}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-gray-100">
                              {excursion.price * excursion.bookings} DT
                        </TableCell>

                        <TableCell>
                          <div className="flex space-x-1 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleViewExcursion(excursion)}
                              className="text-gray-900 border-admin-border hover:bg-admin-bg"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditExcursion(excursion)}
                              className="bg-yellow-600 hover:text-gray-900 border-admin-border hover:bg-bg-yellow-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteExcursion(excursion)}
                              className="bg-red-700 text-gray-200 border-admin-border hover:bg-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
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

        {/* Excursion Modal */}
        <ExcursionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          excursion={selectedExcursion}
          mode={modalMode}
          onSave={handleSaveExcursion}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminExcursions;