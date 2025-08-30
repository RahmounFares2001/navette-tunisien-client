import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Excursion {
  id?: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  photos: string[];
  status: 'active' | 'inactive';
}

interface ExcursionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excursion?: Excursion;
  mode: 'add' | 'edit' | 'view';
  onSave?: (excursion: Excursion) => void;
}

const ExcursionModal = ({ open, onOpenChange, excursion, mode, onSave }: ExcursionModalProps) => {
  const [formData, setFormData] = useState<Excursion>(excursion || {
    title: '',
    description: '',
    duration: '',
    price: 0,
    photos: [],
    status: 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    onOpenChange(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Simulate photo upload - in real app would upload to server
    const photoUrls = files.map((file, index) => URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, photos: photoUrls }));
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-admin-card border-admin-border">
        <DialogHeader>
          <DialogTitle className="text-admin-foreground text-xl font-bold">
            {mode === 'add' && 'Ajouter une Excursion'}
            {mode === 'edit' && 'Modifier l\'Excursion'}
            {mode === 'view' && 'Détails de l\'Excursion'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-admin-foreground">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-admin-bg border-admin-border text-admin-foreground"
                  readOnly={isReadOnly}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-admin-foreground">Durée</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="ex: 3 heures"
                  className="bg-admin-bg border-admin-border text-admin-foreground"
                  readOnly={isReadOnly}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-admin-foreground">Prix (TND)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
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
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-admin-foreground">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="bg-admin-bg border-admin-border text-admin-foreground resize-none"
                  readOnly={isReadOnly}
                  required
                />
              </div>

              {!isReadOnly && (
                <div className="space-y-2">
                  <Label htmlFor="photos" className="text-admin-foreground">Photos (5 maximum)</Label>
                  <Input
                    id="photos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="bg-admin-bg border-admin-border text-admin-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-500 file:text-white"
                  />
                </div>
              )}

              {formData.photos.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-admin-foreground">Aperçu des Photos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {formData.photos.slice(0, 4).map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded border border-admin-border"
                      />
                    ))}
                  </div>
                  {formData.photos.length > 4 && (
                    <p className="text-sm text-admin-muted">+{formData.photos.length - 4} autre(s) photo(s)</p>
                  )}
                </div>
              )}
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

export default ExcursionModal;