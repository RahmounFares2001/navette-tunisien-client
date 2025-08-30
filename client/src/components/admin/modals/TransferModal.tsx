import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Transfer {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  departure: string;
  destination: string;
  vehicle: string;
  travelDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer?: Transfer;
  mode: 'add' | 'edit' | 'view';
  onSave?: (transfer: Transfer) => void;
}

const TransferModal = ({ open, onOpenChange, transfer, mode, onSave }: TransferModalProps) => {
  const [formData, setFormData] = useState<Transfer>(transfer || {
    fullName: '',
    email: '',
    phone: '',
    departure: '',
    destination: '',
    vehicle: '',
    travelDate: '',
    status: 'pending'
  });

  const vehicles = ['Sedan Confort', 'SUV Premium', 'Minibus', 'Van Luxe'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    onOpenChange(false);
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-admin-card border-admin-border">
        <DialogHeader>
          <DialogTitle className="text-admin-foreground text-xl font-bold">
            {mode === 'add' && 'Ajouter un Transfert'}
            {mode === 'edit' && 'Modifier le Transfert'}
            {mode === 'view' && 'Détails du Transfert'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-admin-foreground">Nom Complet</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="bg-admin-bg border-admin-border text-admin-foreground"
                readOnly={isReadOnly}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-admin-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-admin-bg border-admin-border text-admin-foreground"
                readOnly={isReadOnly}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-admin-foreground">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-admin-bg border-admin-border text-admin-foreground"
                readOnly={isReadOnly}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="travelDate" className="text-admin-foreground">Date de Voyage</Label>
              <Input
                id="travelDate"
                type="date"
                value={formData.travelDate}
                onChange={(e) => setFormData(prev => ({ ...prev, travelDate: e.target.value }))}
                className="bg-admin-bg border-admin-border text-admin-foreground"
                readOnly={isReadOnly}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departure" className="text-admin-foreground">Lieu de Départ</Label>
              <Input
                id="departure"
                value={formData.departure}
                onChange={(e) => setFormData(prev => ({ ...prev, departure: e.target.value }))}
                className="bg-admin-bg border-admin-border text-admin-foreground"
                readOnly={isReadOnly}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination" className="text-admin-foreground">Destination</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                className="bg-admin-bg border-admin-border text-admin-foreground"
                readOnly={isReadOnly}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle" className="text-admin-foreground">Véhicule</Label>
              <Select
                value={formData.vehicle}
                onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle: value }))}
                disabled={isReadOnly}
              >
                <SelectTrigger className="bg-admin-bg border-admin-border text-admin-foreground">
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle} value={vehicle}>{vehicle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-admin-foreground">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                disabled={isReadOnly}
              >
                <SelectTrigger className="bg-admin-bg border-admin-border text-admin-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En Attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
              >
                {mode === 'add' ? 'Ajouter' : 'Sauvegarder'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="text-admin-foreground border-admin-border flex-1"
              >
                Annuler
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;