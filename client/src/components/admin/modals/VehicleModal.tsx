import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Vehicle {
  id?: string;
  name: string;
  seats: number;
  photo?: string;
  status: 'available' | 'unavailable' | 'maintenance';
  bookings?: number;
  lastService?: string;
}

interface VehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle;
  mode: 'add' | 'edit' | 'view';
  onSave?: (vehicle: Vehicle) => void;
}

const VehicleModal = ({ open, onOpenChange, vehicle, mode, onSave }: VehicleModalProps) => {
  const [formData, setFormData] = useState<Vehicle>(vehicle || {
    name: '',
    seats: 4,
    photo: '',
    status: 'available'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    onOpenChange(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate photo upload - in real app would upload to server
      const photoUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, photo: photoUrl }));
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-admin-card border-admin-border">
        <DialogHeader>
          <DialogTitle className="text-admin-foreground text-xl font-bold">
            {mode === 'add' && 'Ajouter un Véhicule'}
            {mode === 'edit' && 'Modifier le Véhicule'}
            {mode === 'view' && 'Détails du Véhicule'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-admin-foreground">Nom du Véhicule</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-admin-bg border-admin-border text-admin-foreground"
                readOnly={isReadOnly}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats" className="text-admin-foreground">Nombre de Places</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                max="50"
                value={formData.seats}
                onChange={(e) => setFormData(prev => ({ ...prev, seats: Number(e.target.value) }))}
                className="bg-admin-bg border-admin-border text-admin-foreground"
                readOnly={isReadOnly}
                required
              />
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
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="unavailable">Indisponible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isReadOnly && (
              <div className="space-y-2">
                <Label htmlFor="photo" className="text-admin-foreground">Photo du Véhicule</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="bg-admin-bg border-admin-border text-admin-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-500 file:text-white"
                />
              </div>
            )}

            {formData.photo && (
              <div className="space-y-2">
                <Label className="text-admin-foreground">Aperçu de la Photo</Label>
                <img
                  src={formData.photo}
                  alt="Vehicle preview"
                  className="w-full h-32 object-cover rounded border border-admin-border"
                />
              </div>
            )}
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

export default VehicleModal;