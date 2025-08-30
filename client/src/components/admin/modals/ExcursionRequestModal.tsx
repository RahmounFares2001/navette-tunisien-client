import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExcursionRequest {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  excursionTitle: string;
  numberOfPeople: number;
  message: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
}

interface ExcursionRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: ExcursionRequest;
  mode: 'add' | 'edit' | 'view';
  onSave?: (request: ExcursionRequest) => void;
}

const ExcursionRequestModal = ({ open, onOpenChange, request, mode, onSave }: ExcursionRequestModalProps) => {
  const [formData, setFormData] = useState<ExcursionRequest>(request || {
    fullName: '',
    email: '',
    phone: '',
    excursionTitle: '',
    numberOfPeople: 1,
    message: '',
    date: '',
    status: 'pending',
    totalPrice: 0
  });

  const excursions = [
    'Visite de Carthage',
    'Sidi Bou Saïd et Carthage',
    'Médina de Tunis',
    'Kairouan la Sainte',
    'El Jem et Kairouan'
  ];

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
            {mode === 'add' && 'Ajouter une Demande d\'Excursion'}
            {mode === 'edit' && 'Modifier la Demande'}
            {mode === 'view' && 'Détails de la Demande'}
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
              <Label htmlFor="date" className="text-admin-foreground">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-admin-bg border-admin-border text-admin-foreground"
                readOnly={isReadOnly}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excursionTitle" className="text-admin-foreground">Excursion</Label>
              <Select
                value={formData.excursionTitle}
                onValueChange={(value) => setFormData(prev => ({ ...prev, excursionTitle: value }))}
                disabled={isReadOnly}
              >
                <SelectTrigger className="bg-admin-bg border-admin-border text-admin-foreground">
                  <SelectValue placeholder="Sélectionner une excursion" />
                </SelectTrigger>
                <SelectContent>
                  {excursions.map(excursion => (
                    <SelectItem key={excursion} value={excursion}>{excursion}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfPeople" className="text-admin-foreground">Nombre de Personnes</Label>
              <Input
                id="numberOfPeople"
                type="number"
                min="1"
                max="8"
                value={formData.numberOfPeople}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfPeople: Number(e.target.value) }))}
                className="bg-admin-bg border-admin-border text-admin-foreground"
                readOnly={isReadOnly}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPrice" className="text-admin-foreground">Prix Total (TND)</Label>
              <Input
                id="totalPrice"
                type="number"
                value={formData.totalPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, totalPrice: Number(e.target.value) }))}
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
                  <SelectItem value="pending">En Attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-admin-foreground">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
              className="bg-admin-bg border-admin-border text-admin-foreground resize-none"
              readOnly={isReadOnly}
            />
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

export default ExcursionRequestModal;