import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AdminLayout from '@/components/admin/AdminLayout';
import AddExcursionModal from '@/components/admin/modals/excursion/AddExcursionModal';
import UpdateExcursionModal from '@/components/admin/modals/excursion/UpdateExcursionModal';
import { useGetAllExcursionsQuery, useDeleteExcursionMutation } from '@/globalRedux/features/api/apiSlice';
import { IExcursionResponse } from '@/types/types';
import { toast } from 'react-toastify';

const AdminExcursions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedExcursion, setSelectedExcursion] = useState<IExcursionResponse | undefined>(undefined);
  const [excursionToDelete, setExcursionToDelete] = useState<IExcursionResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const { data, isLoading, error } = useGetAllExcursionsQuery({ page: currentPage, limit: 10, search: searchTerm }, { skip: !isMounted, pollingInterval: 30000 });
  const [deleteExcursion, { isLoading: isDeleting }] = useDeleteExcursionMutation();

  const excursions = data?.data || [];
  const totalPages = Math.min(data?.totalPages || 1, 5);
  const totalItems = data?.totalItems || 0;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getStatusBadgeColor = (status: boolean) => {
    return status ? 'bg-green-700 text-white' : 'bg-gray-300 text-black';
  };

  const getStatusText = (status: boolean) => {
    return status ? 'Disponible' : 'Indisponible';
  };

  const filteredExcursions = excursions.filter(excursion => {
    const matchesSearch = excursion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         excursion.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'available' ? excursion.isAvailable : !excursion.isAvailable);
    return matchesSearch && matchesStatus;
  });

  const handleEditExcursion = (excursion: IExcursionResponse) => {
    setSelectedExcursion(excursion);
    setEditModalOpen(true);
  };

  const handleDeleteExcursion = (excursion: IExcursionResponse) => {
    setExcursionToDelete(excursion);
    setDeleteModalOpen(true);
  };

  const confirmDeleteExcursion = async () => {
    if (excursionToDelete) {
      try {
        await deleteExcursion(excursionToDelete._id).unwrap();
        toast.success('Excursion supprimée avec succès', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } catch (err) {
        console.error('Failed to delete excursion:', err);
        toast.error('Échec de la suppression de l\'excursion', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      }
    }
    setDeleteModalOpen(false);
    setExcursionToDelete(null);
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
            <div>
              <h1 className="text-3xl font-bold text-admin-foreground">
                Gestion des Excursions
              </h1>
            </div>
            <Button 
              onClick={() => setAddModalOpen(true)}
              className="bg-admin-foreground text-admin-bg hover:bg-gray-300"
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
                        <SelectItem value="all">Tous les Statuts</SelectItem>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="unavailable">Indisponible</SelectItem>
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
                {isLoading && <p className="text-admin-foreground">Chargement...</p>}
                {error && <p className="text-red-500">Erreur de chargement des excursions</p>}
                {!isLoading && !error && (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-admin-border hover:bg-transparent">
                            <TableHead className="text-admin-foreground">Titre</TableHead>
                            <TableHead className="text-admin-foreground hidden sm:table-cell">Durée</TableHead>
                            <TableHead className="text-admin-foreground">Statut</TableHead>
                            <TableHead className="text-admin-foreground text-right pr-16">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredExcursions.map((excursion) => (
                            <TableRow key={excursion._id} className="border-admin-border hover:bg-admin-bg/50">
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
                                  {excursion.duration} Heures
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusBadgeColor(excursion.isAvailable)}>
                                  {getStatusText(excursion.isAvailable)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1 justify-end">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleEditExcursion(excursion)}
                                    className="bg-yellow-600 hover:text-gray-900 border-admin-border hover:bg-yellow-700"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleDeleteExcursion(excursion)}
                                    className="bg-red-700 text-gray-200 border-admin-border hover:bg-red-800"
                                    disabled={isDeleting}
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
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="flex items-center justify-center space-x-2 mt-4"
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
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Modals */}
          <AddExcursionModal
            open={addModalOpen}
            onOpenChange={setAddModalOpen}
            onSave={() => setAddModalOpen(false)}
          />
          <UpdateExcursionModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            excursion={selectedExcursion}
            onSave={() => setEditModalOpen(false)}
          />
          <Dialog open={deleteModalOpen} onOpenChange={() => setDeleteModalOpen(false)}>
            <DialogContent className="max-w-md bg-admin-card border-admin-border">
              <DialogHeader>
                <DialogTitle className="text-admin-foreground text-xl font-bold">
                  Confirmer la Suppression
                </DialogTitle>
                <DialogDescription className="text-admin-foreground">
                  Êtes-vous sûr de vouloir supprimer l'excursion ? Cette action est irréversible.
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
                  onClick={confirmDeleteExcursion}
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

export default AdminExcursions;