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
import AddExcursionRequestModal from '@/components/admin/modals/excursionRequest/AddExcursionRequestModal';
import UpdateExcursionRequestModal from '@/components/admin/modals/excursionRequest/UpdateExcursionRequestModal';
import { useGetAllExcursionRequestsQuery, useDeleteExcursionRequestMutation } from '@/globalRedux/features/api/apiSlice';
import { IExcursionRequestResponse, ListParams } from '@/types/types';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';

const AdminExcursionRequests = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed_non_paye' | 'confirmed_paye' | 'completed' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<IExcursionRequestResponse | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<IExcursionRequestResponse | null>(null);

  // Debounced search handler
  const debouncedSearch = debounce(() => {
    setPage(1); // Reset to page 1 on search
  }, 500);

  useEffect(() => {
    setIsMounted(true);
    debouncedSearch(searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm]);

  // Map statusFilter to query parameters
  const getQueryParams = (): ListParams => {
    const params: ListParams = {
      page,
      limit: 10,
      search: searchTerm.trim() || undefined,
    };
    if (statusFilter === 'pending') {
      params.status = 'pending';
    } else if (statusFilter === 'confirmed_non_paye') {
      params.status = 'confirmed';
      params.paymentPercentage = 0;
    } else if (statusFilter === 'confirmed_paye') {
      params.status = 'confirmed';
      params.paymentPercentage = 100;
    } else if (statusFilter === 'completed') {
      params.status = 'completed';
    } else if (statusFilter === 'rejected') {
      params.status = 'rejected';
    }
    return params;
  };

  const { data, isLoading, error } = useGetAllExcursionRequestsQuery(getQueryParams(), { skip: !isMounted, pollingInterval: 30000 });  const [deleteExcursionRequest, { isLoading: isDeleting }] = useDeleteExcursionRequestMutation();

  const totalPages = Math.min(data?.totalPages || 1, 5);
  const totalItems = data?.totalItems || 0;
  const excursionRequests = data?.data || [];

  const getStatusBadgeColor = (status: 'pending' | 'confirmed' | 'completed' | 'rejected', paymentPercentage?: 0 | 100) => {
    if (status === 'confirmed') {
      return paymentPercentage === 0 ? 'bg-orange-600 text-white' : 'bg-green-700 text-white';
    }
    switch (status) {
      case 'pending': return 'bg-gray-300 text-black';
      case 'completed': return 'bg-blue-700 text-white';
      case 'rejected': return 'bg-red-700 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: 'pending' | 'confirmed' | 'completed' | 'rejected', paymentPercentage?: 0 | 100) => {
    if (status === 'confirmed') {
      return paymentPercentage === 0 ? 'Confirmé (Non Payé)' : 'Confirmé (Payé)';
    }
    switch (status) {
      case 'pending': return 'En Attente';
      case 'completed': return 'Terminé';
      case 'rejected': return 'Rejeté';
      default: return 'Inconnu';
    }
  };

  const handleEditRequest = (request: IExcursionRequestResponse) => {
    setSelectedRequest(request);
    setEditModalOpen(true);
  };

  const handleDeleteRequest = (request: IExcursionRequestResponse) => {
    setRequestToDelete(request);
    setDeleteModalOpen(true);
  };

  const confirmDeleteRequest = async () => {
    if (requestToDelete) {
      try {
        await deleteExcursionRequest(requestToDelete._id).unwrap();
        toast.success('Demande d\'excursion supprimée avec succès', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } catch (err) {
        toast.error('Échec de la suppression de la demande d\'excursion', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      }
    }
    setDeleteModalOpen(false);
    setRequestToDelete(null);
  };

  const handleSaveRequest = () => {
    setEditModalOpen(false);
    setAddModalOpen(false);
    setSelectedRequest(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      setPageInput('');
    }
  };

  const handlePageInputSubmit = () => {
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum);
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

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-500">Erreur lors du chargement des demandes d'excursions: {JSON.stringify(error)}</div>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between"
          >
            <h1 className="text-3xl font-bold text-admin-foreground">
              Demandes d'Excursions
            </h1>
            <Button
              onClick={() => setAddModalOpen(true)}
              className="bg-admin-foreground text-admin-bg hover:bg-gray-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une Demande
            </Button>
          </motion.div>

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
                        placeholder="Rechercher par nom, email ou excursion..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div className="w-full sm:w-48">
                    <Select
                      value={statusFilter}
                      onValueChange={(value: 'all' | 'pending' | 'confirmed_non_paye' | 'confirmed_paye' | 'completed' | 'rejected') => {
                        setStatusFilter(value);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les Statuts</SelectItem>
                        <SelectItem value="pending">En Attente</SelectItem>
                        <SelectItem value="confirmed_non_paye">Confirmé (Non Payé)</SelectItem>
                        <SelectItem value="confirmed_paye">Confirmé (Payé)</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-admin-card border-admin-border">
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
                        <TableHead className="text-admin-foreground font-bold">Client</TableHead>
                        <TableHead className="text-admin-foreground font-bold hidden lg:table-cell">Excursion</TableHead>
                        <TableHead className="text-admin-foreground font-bold hidden sm:table-cell">Personnes</TableHead>
                        <TableHead className="text-admin-foreground font-bold">Date</TableHead>
                        <TableHead className="text-admin-foreground font-bold">Statut</TableHead>
                        <TableHead className="text-admin-foreground font-bold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {excursionRequests.map((request) => (
                        <TableRow key={request._id} className="border-admin-border hover:bg-admin-bg/50">
                          <TableCell>
                            <div className="font-medium text-admin-foreground">
                              {request.clientName}
                            </div>
                            <div className="md:hidden text-xs text-admin-muted mt-1">
                              {request.clientEmail}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="text-sm text-admin-foreground font-medium">
                              {request.excursionId?.title || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-sm text-admin-foreground">
                              {request.numberOfAdults + request.numberOfChildren + request.numberOfBabies}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-admin-foreground">
                              {new Date(request.excursionDate).toLocaleDateString('fr-FR')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(request.status, request.paymentPercentage)}>
                              {getStatusText(request.status, request.paymentPercentage)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRequest(request)}
                                className="bg-yellow-600 hover:text-gray-900 border-admin-border hover:bg-yellow-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteRequest(request)}
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
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="bg-admin-bg text-admin-foreground hover:bg-gray-300 border-admin-border"
                  >
                    Précédent
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={page === p ? 'bg-admin-foreground text-admin-bg' : 'bg-admin-bg text-admin-foreground hover:bg-gray-300 border-admin-border'}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
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
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <AddExcursionRequestModal
            open={addModalOpen}
            onOpenChange={setAddModalOpen}
            onSave={handleSaveRequest}
          />
          <UpdateExcursionRequestModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            request={selectedRequest}
            onSave={handleSaveRequest}
          />
          <Dialog open={deleteModalOpen} onOpenChange={() => setDeleteModalOpen(false)}>
            <DialogContent className="max-w-md bg-admin-card border-admin-border">
              <DialogHeader>
                <DialogTitle className="text-admin-foreground text-xl font-bold">
                  Confirmer la Suppression
                </DialogTitle>
                <DialogDescription className="text-admin-foreground">
                  Êtes-vous sûr de vouloir supprimer la demande d'excursion ? Cette action est irréversible.
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
                  onClick={confirmDeleteRequest}
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

export default AdminExcursionRequests;