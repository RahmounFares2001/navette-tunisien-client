import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateVehicleMutation } from '@/globalRedux/features/api/apiSlice';
import { IVehicleResponse } from '@/types/types';
import { Upload } from 'lucide-react';
import { toast } from 'react-toastify';

interface UpdateVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: IVehicleResponse;
  onSave?: (vehicle: IVehicleResponse) => void;
}

const UpdateVehicleModal = ({ open, onOpenChange, vehicle, onSave }: UpdateVehicleModalProps) => {
  const [formData, setFormData] = useState<IVehicleResponse>({
    _id: vehicle?._id || '',
    name: vehicle?.name || '',
    numberOfSeats: vehicle?.numberOfSeats || 4,
    numberOfSuitcases: vehicle?.numberOfSuitcases || 0,
    pricePerKm: vehicle?.pricePerKm || 1,
    imgUrl: vehicle?.imgUrl || '',
    isAvailable: vehicle?.isAvailable ?? true,
    createdAt: vehicle?.createdAt || '',
  });
  const [previewUrl, setPreviewUrl] = useState<string>(vehicle?.imgUrl ? `${import.meta.env.VITE_API_IMG}${vehicle.imgUrl}` : '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState({ name: '', image: '', numberOfSeats: '', numberOfSuitcases: '', pricePerKm: '' });
  const [updateVehicle, { isLoading }] = useUpdateVehicleMutation();

  useEffect(() => {
    if (vehicle) {
      setFormData({
        _id: vehicle._id,
        name: vehicle.name,
        numberOfSeats: vehicle.numberOfSeats,
        numberOfSuitcases: vehicle.numberOfSuitcases || 0,
        pricePerKm: vehicle.pricePerKm,
        imgUrl: vehicle.imgUrl,
        isAvailable: vehicle.isAvailable,
        createdAt: vehicle.createdAt,
      });
      setPreviewUrl(vehicle.imgUrl ? `${import.meta.env.VITE_API_IMG}${vehicle.imgUrl}` : '');
      setSelectedFile(null);
      setErrors({ name: '', image: '', numberOfSeats: '', numberOfSuitcases: '', pricePerKm: '' });
    }
  }, [vehicle]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: "L'image ne doit pas dépasser 2 Mo" }));
        setSelectedFile(null);
        setPreviewUrl(formData.imgUrl ? `${import.meta.env.VITE_API_IMG}${formData.imgUrl}` : '');
        toast.error("L'image ne doit pas dépasser 2 Mo", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
        return;
      }
      setErrors(prev => ({ ...prev, image: '' }));
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = { name: '', image: '', numberOfSeats: '', numberOfSuitcases: '', pricePerKm: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du véhicule est requis';
      isValid = false;
    }
    if (!formData.imgUrl && !selectedFile) {
      newErrors.image = 'Veuillez sélectionner une image';
      isValid = false;
    }
    if (formData.numberOfSeats < 1 || isNaN(formData.numberOfSeats)) {
      newErrors.numberOfSeats = 'Le nombre de places doit être supérieur à 1';
      isValid = false;
    }
    if (formData.numberOfSuitcases < 0 || isNaN(formData.numberOfSuitcases)) {
      newErrors.numberOfSuitcases = 'Le nombre de valises ne peut pas être négatif';
      isValid = false;
    }
    if (formData.pricePerKm < 1 || isNaN(formData.pricePerKm)) {
      newErrors.pricePerKm = 'Le prix par kilomètre doit être supérieur à 1';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('numberOfSeats', formData.numberOfSeats.toString());
      submitData.append('numberOfSuitcases', formData.numberOfSuitcases.toString());
      submitData.append('pricePerKm', formData.pricePerKm.toString());
      submitData.append('isAvailable', formData.isAvailable.toString());
      if (selectedFile) {
        submitData.append('image', selectedFile);
      }

      console.log('Sending data:', Object.fromEntries(submitData));

      const response = await updateVehicle({ id: formData._id, data: submitData }).unwrap();

      const updatedVehicle = response.data as IVehicleResponse;
      setFormData(updatedVehicle);
      setPreviewUrl(updatedVehicle.imgUrl ? `${import.meta.env.VITE_API_IMG}${updatedVehicle.imgUrl}?t=${Date.now()}` : '');
      setSelectedFile(null);
      onSave?.(updatedVehicle);
      onOpenChange(false);
      setErrors({ name: '', image: '', numberOfSeats: '', numberOfSuitcases: '', pricePerKm: '' });
      toast.success('Véhicule mis à jour avec succès', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } catch (error: any) {
      console.error('Failed to update vehicle:', error);
      const errorMessage = error?.data?.message || 'Échec de la mise à jour du véhicule';
      setErrors(prev => ({ ...prev, name: errorMessage }));
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-admin-card border-admin-border">
        <DialogHeader>
          <DialogTitle className="text-admin-foreground text-xl font-bold">
            Modifier le Véhicule
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-admin-foreground">Nom du Véhicule</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
              required
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="seats" className="text-admin-foreground">Nombre de Places</Label>
            <Input
              id="seats"
              type="number"
              min="1"
              max="50"
              value={formData.numberOfSeats}
              onChange={(e) => setFormData(prev => ({ ...prev, numberOfSeats: Number(e.target.value) }))}
              className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
              required
            />
            {errors.numberOfSeats && <p className="text-red-500 text-sm">{errors.numberOfSeats}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="suitcases" className="text-admin-foreground">Nombre de Valises</Label>
            <Input
              id="suitcases"
              type="number"
              min="0"
              max="50"
              value={formData.numberOfSuitcases}
              onChange={(e) => setFormData(prev => ({ ...prev, numberOfSuitcases: Number(e.target.value) }))}
              className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
            />
            {errors.numberOfSuitcases && <p className="text-red-500 text-sm">{errors.numberOfSuitcases}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricePerKm" className="text-admin-foreground">Prix par Kilomètre (€)</Label>
            <Input
              id="pricePerKm"
              type="number"
              min="1"
              step="0.01"
              value={formData.pricePerKm}
              onChange={(e) => setFormData(prev => ({ ...prev, pricePerKm: Number(e.target.value) }))}
              className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
              required
            />
            {errors.pricePerKm && <p className="text-red-500 text-sm">{errors.pricePerKm}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="image" className="text-admin-foreground">Image du Véhicule</Label>
            <div className="relative">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="image"
                className="flex items-center justify-center w-full p-3 bg-admin-bg border-2 border-dashed border-admin-border text-admin-foreground rounded-md cursor-pointer hover:bg-orange-500/10 transition-colors"
              >
                <Upload className="h-5 w-5 mr-2" />
                <span>Choisir une image (max 2 Mo)</span>
              </label>
            </div>
            {errors.image && <p className="text-red-500 text-sm">{errors.image}</p>}
          </div>
          {previewUrl && (
            <div className="space-y-2">
              <Label className="text-admin-foreground">Aperçu de l'Image</Label>
              <img
                src={previewUrl}
                alt="Vehicle preview"
                className="w-full h-32 object-cover rounded-md border border-admin-border"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="isAvailable" className="text-admin-foreground">Statut</Label>
            <Select
              value={formData.isAvailable ? 'available' : 'unavailable'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isAvailable: value === 'available' }))}
            >
              <SelectTrigger className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="unavailable">Indisponible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-admin-foreground text-admin-bg hover:bg-gray-300 flex-1"
            >
              {isLoading ? 'Mise à jour...' : 'Sauvegarder'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                setPreviewUrl(formData.imgUrl ? `${import.meta.env.VITE_API_IMG}${formData.imgUrl}` : '');
                setErrors({ name: '', image: '', numberOfSeats: '', numberOfSuitcases: '', pricePerKm: '' });
                setSelectedFile(null);
              }}
              className="text-gray-900 border-admin-border flex-1"
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateVehicleModal;