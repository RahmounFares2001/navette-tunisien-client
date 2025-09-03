import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/components/admin/AdminLayout';
import { useGetAllTransfersQuery, useDeleteTransferMutation } from '@/globalRedux/features/api/apiSlice';
import AddTransferModal from '@/components/admin/modals/transfer/AddTransferModal';
import UpdateTransferModal from '@/components/admin/modals/transfer/UpdateTransferModal';
import { ITransferResponse, CreateTransferRequest, UpdateTransferRequest } from '@/types/types';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';

const AdminTransfers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed_non_paye' | 'confirmed_paye' | 'completed' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<ITransferResponse | null>(null);
  const [transferToDelete, setTransferToDelete] = useState<ITransferResponse | null>(null);

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
  const getQueryParams = () => {
    const params: { page: number; limit: number; status?: string; paymentPercentage?: number; search?: string } = {
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
    console.log('Query params:', params); // Debug query params
    return params;
  };

  const { data: transfersData, isLoading, error } = useGetAllTransfersQuery(getQueryParams(), { skip: !isMounted, pollingInterval: 30000 });
  // Debug API response
  useEffect(() => {
    if (transfersData) {
      console.log('API response:', transfersData);
      console.log('Transfers:', transfersData.data);
    }
  }, [transfersData]);

  const [deleteTransfer] = useDeleteTransferMutation();

  const totalPages = Math.min(transfersData?.totalPages || 1, 5);

  const getStatusBadgeColor = (status: 'pending' | 'confirmed' | 'completed' | 'rejected', paymentPercentage?: 0 | 100) => {
    if (status === 'confirmed') {
      return paymentPercentage === 0 ? 'bg-orange-600 text-white' : 'bg-green-700 text-white';
    }
    switch (status) {
      case 'pending': return 'bg-gray-300 text-black';
      case 'completed': return 'bg-blue-700 text-white';
      case 'rejected': return 'bg-red-700 text-white';
      default: 
        console.warn(`Unexpected status: ${status}, paymentPercentage: ${paymentPercentage}`); // Debug unexpected status
        return 'bg-gray-500 text-white';
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
      default: 
        console.warn(`Unexpected status: ${status}, paymentPercentage: ${paymentPercentage}`); // Debug unexpected status
        return 'Inconnu';
    }
  };

  const handleEditTransfer = (transfer: ITransferResponse) => {
    setSelectedTransfer(transfer);
    setUpdateModalOpen(true);
  };

  const handleDeleteTransfer = (transfer: ITransferResponse) => {
    setTransferToDelete(transfer);
    setDeleteModalOpen(true);
  };

  const confirmDeleteTransfer = async () => {
    if (transferToDelete) {
      try {
        await deleteTransfer(transferToDelete._id).unwrap();
        toast.success('Transfert supprimé avec succès', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } catch (error) {
        console.error('Failed to delete transfer:', error);
        toast.error('Échec de la suppression du transfert', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      }
    }
    setDeleteModalOpen(false);
    setTransferToDelete(null);
  };

  const handleSaveTransfer = (transfer: Omit<CreateTransferRequest, 'price'> | Omit<UpdateTransferRequest, 'price'>) => {
    if ('id' in transfer) {
      setUpdateModalOpen(false);
      setSelectedTransfer(null);
    } else {
      setAddModalOpen(false);
    }
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
    console.error('Error fetching transfers:', error);
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-500">Erreur lors du chargement des transferts: {JSON.stringify(error)}</div>
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
              Gestion des Transferts
            </h1>
            <Button 
              onClick={() => setAddModalOpen(true)}
              className="bg-admin-foreground text-admin-bg hover:bg-gray-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un Transfert
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
                        placeholder="Rechercher par nom, email ou téléphone..."
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
                        console.log('Filter changed to:', value); // Debug filter selection
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

          {/* Transfers Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-admin-card border-admin-border">
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
                      {(transfersData?.data || []).map((transfer) => (
                        <TableRow key={transfer._id} className="border-admin-border hover:bg-admin-bg/50">
                          <TableCell>
                            <div className="font-medium text-admin-foreground">
                              {transfer.clientName}
                            </div>
                            <div className="md:hidden text-xs text-admin-muted mt-1">
                              {transfer.clientEmail}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-sm text-admin-foreground">
                              {transfer.vehicleId?.name || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-admin-foreground">
                              {new Date(transfer.travelDate).toLocaleDateString('fr-FR')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(transfer.status, transfer.paymentPercentage)}>
                              {getStatusText(transfer.status, transfer.paymentPercentage)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex space-x-2 justify-end">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditTransfer(transfer)}
                                className="bg-yellow-600 hover:text-gray-900 text-admin-foreground border-admin-border hover:bg-yellow-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleDeleteTransfer(transfer)}
                                className="bg-red-700 text-gray-100 hover:text-gray-100 border-admin-border hover:bg-red-800"
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
                <div className="flex items-center justify-center mt-4 space-x-2">
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

          {/* Modals */}
          <AddTransferModal
            open={addModalOpen}
            onOpenChange={setAddModalOpen}
            onSave={handleSaveTransfer}
          />
          <UpdateTransferModal
            open={updateModalOpen}
            onOpenChange={setUpdateModalOpen}
            transfer={selectedTransfer}
            onSave={handleSaveTransfer}
          />
          <Dialog open={deleteModalOpen} onOpenChange={() => setDeleteModalOpen(false)}>
            <DialogContent className="max-w-md bg-admin-card border-admin-border">
              <DialogHeader>
                <DialogTitle className="text-admin-foreground text-xl font-bold">
                  Confirmer la Suppression
                </DialogTitle>
                <DialogDescription className="text-admin-foreground">
                  Êtes-vous sûr de vouloir supprimer ce transfert ? Cette action est irréversible.
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
                  onClick={confirmDeleteTransfer}
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

export default AdminTransfers;