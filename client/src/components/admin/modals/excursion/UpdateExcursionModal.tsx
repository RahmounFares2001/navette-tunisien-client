import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateExcursionMutation } from '@/globalRedux/features/api/apiSlice';
import { IExcursionResponse } from '@/types/types';
import { Upload, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface UpdateExcursionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excursion?: IExcursionResponse;
  onSave?: (updatedExcursion?: IExcursionResponse) => void;
}

const UpdateExcursionModal = ({ open, onOpenChange, excursion, onSave }: UpdateExcursionModalProps) => {
  const [formData, setFormData] = useState<IExcursionResponse>({
    _id: excursion?._id || '',
    title: excursion?.title || '',
    description: excursion?.description || '',
    includedItems: excursion?.includedItems || [],
    dailyProgram: excursion?.dailyProgram || [],
    prices: excursion?.prices || { oneToFour: 0, fiveToSix: 0, sevenToEight: 0 },
    duration: excursion?.duration || 0,
    imageUrls: excursion?.imageUrls || [],
    isAvailable: excursion?.isAvailable ?? true,
    createdAt: excursion?.createdAt || '',
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>(Array(5).fill(''));
  const [selectedFiles, setSelectedFiles] = useState<(File | null)[]>(Array(5).fill(null));
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    includedItems: '',
    dailyProgram: '',
    oneToFour: '',
    fiveToSix: '',
    sevenToEight: '',
    duration: '',
    images: '',
  });
  const [updateExcursion, { isLoading }] = useUpdateExcursionMutation();

  useEffect(() => {
    if (excursion) {
      setFormData({
        _id: excursion._id,
        title: excursion.title,
        description: excursion.description,
        includedItems: excursion.includedItems,
        dailyProgram: excursion.dailyProgram,
        prices: excursion.prices || { oneToFour: 0, fiveToSix: 0, sevenToEight: 0 },
        duration: excursion.duration || 0,
        imageUrls: excursion.imageUrls,
        isAvailable: excursion.isAvailable,
        createdAt: excursion.createdAt,
      });
      // Initialize previewUrls with existing imageUrls (server URLs)
      const newPreviews = Array(5).fill('');
      excursion.imageUrls.forEach((url, index) => {
        newPreviews[index] = `${import.meta.env.VITE_API_IMG}${url}`;
      });
      setPreviewUrls(newPreviews);
      setSelectedFiles(Array(5).fill(null));
      setImagesToDelete([]);
      setErrors({
        title: '',
        description: '',
        includedItems: '',
        dailyProgram: '',
        oneToFour: '',
        fiveToSix: '',
        sevenToEight: '',
        duration: '',
        images: '',
      });
    }
  }, [excursion]);

  const handleImageUpload = (index: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast.error(`L'image ${file.name} dépasse 1 Mo`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return;
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Remove the existing image at this index from imagesToDelete if it was a server URL
      const existingUrl = formData.imageUrls[index];
      if (existingUrl && !existingUrl.startsWith('data:image/')) {
        setImagesToDelete((prev) => [...prev, existingUrl]);
      }

      // Update imageUrls with the new base64 string
      const newImageUrls = [...formData.imageUrls];
      newImageUrls[index] = base64;
      setFormData((prev) => ({ ...prev, imageUrls: newImageUrls }));

      // Update previewUrls and selectedFiles
      const newPreviews = [...previewUrls];
      newPreviews[index] = URL.createObjectURL(file);
      setPreviewUrls(newPreviews);

      const newFiles = [...selectedFiles];
      newFiles[index] = file;
      setSelectedFiles(newFiles);

      setErrors((prev) => ({ ...prev, images: '' }));
    } catch (error) {
      toast.error("Erreur lors du chargement de l'image", {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  const handleImageDelete = (index: number) => () => {
    const url = formData.imageUrls[index];
    if (url && !url.startsWith('data:image/')) {
      setImagesToDelete((prev) => [...prev, url]);
    }

    const newImageUrls = [...formData.imageUrls];
    newImageUrls[index] = '';
    setFormData((prev) => ({ ...prev, imageUrls: newImageUrls.filter((url) => url) }));

    const newPreviews = [...previewUrls];
    newPreviews[index] = '';
    setPreviewUrls(newPreviews);

    const newFiles = [...selectedFiles];
    newFiles[index] = null;
    setSelectedFiles(newFiles);
  };

  const validateForm = () => {
    const newErrors = {
      title: '',
      description: '',
      includedItems: '',
      dailyProgram: '',
      oneToFour: '',
      fiveToSix: '',
      sevenToEight: '',
      duration: '',
      images: '',
    };
    let isValid = true;

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
      isValid = false;
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
      isValid = false;
    }
    if (!formData.includedItems.length) {
      newErrors.includedItems = 'Les éléments inclus sont requis';
      isValid = false;
    }
    if (!formData.dailyProgram.length) {
      newErrors.dailyProgram = 'Le programme quotidien est requis';
      isValid = false;
    }
    if (formData.prices.oneToFour < 0 || isNaN(formData.prices.oneToFour)) {
      newErrors.oneToFour = 'Le prix (1-4 personnes) doit être un nombre positif';
      isValid = false;
    }
    if (formData.prices.fiveToSix < 0 || isNaN(formData.prices.fiveToSix)) {
      newErrors.fiveToSix = 'Le prix (5-6 personnes) doit être un nombre positif';
      isValid = false;
    }
    if (formData.prices.sevenToEight < 0 || isNaN(formData.prices.sevenToEight)) {
      newErrors.sevenToEight = 'Le prix (7-8 personnes) doit être un nombre positif';
      isValid = false;
    }
    if (formData.duration <= 0 || isNaN(formData.duration)) {
      newErrors.duration = 'La durée doit être un nombre positif';
      isValid = false;
    }
    if (formData.imageUrls.filter((url) => url).length === 0 && imagesToDelete.length >= (excursion?.imageUrls.length || 0)) {
      newErrors.images = 'Au moins une image est requise';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return;
    }

    try {
      const data = {
        title: formData.title,
        description: formData.description,
        includedItems: formData.includedItems,
        dailyProgram: formData.dailyProgram,
        prices: formData.prices,
        duration: formData.duration,
        isAvailable: formData.isAvailable,
        imageUrls: formData.imageUrls.filter((url) => url && url.startsWith('data:image/')),
        imagesToDelete: imagesToDelete.filter((url) => url && !url.startsWith('data:image/')),
      };

      console.log('Sending data:', data);

      const response = await updateExcursion({ id: formData._id, data }).unwrap();

      const updatedExcursion = response.data as IExcursionResponse;
      setFormData(updatedExcursion);
      setImagesToDelete([]);
      setPreviewUrls(
        Array(5)
          .fill('')
          .map((_, i) => (updatedExcursion.imageUrls[i] ? `${import.meta.env.VITE_API_IMG}${updatedExcursion.imageUrls[i]}?t=${Date.now()}` : ''))
      );
      setSelectedFiles(Array(5).fill(null));
      onSave?.(updatedExcursion);
      onOpenChange(false);
      setErrors({
        title: '',
        description: '',
        includedItems: '',
        dailyProgram: '',
        oneToFour: '',
        fiveToSix: '',
        sevenToEight: '',
        duration: '',
        images: '',
      });
      toast.success(response.message || 'Excursion mise à jour avec succès', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } catch (error: any) {
      console.error('Failed to update excursion:', error);
      const errorMessage = error?.data?.message || 'Échec de la mise à jour de l\'excursion';
      setErrors((prev) => ({ ...prev, images: errorMessage }));
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-2/3 bg-admin-card border-admin-border">
        <DialogHeader>
          <DialogTitle className="text-admin-foreground text-xl font-bold">Modifier l'Excursion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white font-bold">Titre</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
              required
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white font-bold">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="bg-admin-bg border-admin-border focus:ring-2 focus:ring-orange-500 h-52 text-gray-300"
              required
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="includedItems" className="text-white font-bold">Éléments Inclus (un par ligne)</Label>
            <Textarea
              id="includedItems"
              value={formData.includedItems.join('\n')}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  includedItems: e.target.value.split('\n').filter((item) => item.trim()),
                }))
              }
              className="bg-admin-bg border-admin-border focus:ring-2 focus:ring-orange-500 h-40 text-gray-300"
              placeholder="Ex. Transport\nGuide\nRepas"
              required
            />
            {errors.includedItems && <p className="text-red-500 text-sm">{errors.includedItems}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dailyProgram" className="text-white font-bold">Programme Quotidien (un par ligne)</Label>
            <Textarea
              id="dailyProgram"
              value={formData.dailyProgram.join('\n')}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dailyProgram: e.target.value.split('\n').filter((item) => item.trim()),
                }))
              }
              className="bg-admin-bg border-admin-border focus:ring-2 focus:ring-orange-500 h-40 text-gray-300"
              placeholder="Ex. Jour 1: Visite de Carthage\nJour 2: Exploration de Sidi Bou Saïd"
              required
            />
            {errors.dailyProgram && <p className="text-red-500 text-sm">{errors.dailyProgram}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="oneToFour" className="text-white font-bold">Prix 1-4 Personnes (DT)</Label>
            <Input
              id="oneToFour"
              type="number"
              min="0"
              step="0.01"
              value={formData.prices.oneToFour}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  prices: { ...prev.prices, oneToFour: Number(e.target.value) },
                }))
              }
              className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
              required
            />
            {errors.oneToFour && <p className="text-red-500 text-sm">{errors.oneToFour}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fiveToSix" className="text-white font-bold">Prix 5-6 Personnes (DT)</Label>
            <Input
              id="fiveToSix"
              type="number"
              min="0"
              step="0.01"
              value={formData.prices.fiveToSix}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  prices: { ...prev.prices, fiveToSix: Number(e.target.value) },
                }))
              }
              className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
              required
            />
            {errors.fiveToSix && <p className="text-red-500 text-sm">{errors.fiveToSix}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sevenToEight" className="text-white font-bold">Prix 7-8 Personnes (DT)</Label>
            <Input
              id="sevenToEight"
              type="number"
              min="0"
              step="0.01"
              value={formData.prices.sevenToEight}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  prices: { ...prev.prices, sevenToEight: Number(e.target.value) },
                }))
              }
              className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
              required
            />
            {errors.sevenToEight && <p className="text-red-500 text-sm">{errors.sevenToEight}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-white font-bold">Durée (heures)</Label>
            <Input
              id="duration"
              type="number"
              min="0"
              step="1"
              value={formData.duration}
              onChange={(e) => setFormData((prev) => ({ ...prev, duration: Number(e.target.value) }))}
              className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
              required
            />
            {errors.duration && <p className="text-red-500 text-sm">{errors.duration}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-white font-bold">Images (max 5, 1 Mo chacune)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="relative">
                    <Input
                      id={`image-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload(index)}
                      className="hidden"
                    />
                    <label
                      htmlFor={`image-${index}`}
                      className="flex items-center justify-center w-full p-2 bg-admin-bg border-2 border-dashed border-admin-border text-admin-foreground rounded-md cursor-pointer hover:bg-orange-500/10 transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      <span>Image {index + 1}</span>
                    </label>
                  </div>
                  {previewUrls[index] && (
                    <div className="flex items-center space-x-2">
                      <img
                        src={
                          selectedFiles[index]
                            ? previewUrls[index]
                            : `${import.meta.env.VITE_API_IMG}${formData.imageUrls[index]}?t=${Date.now()}`
                        }
                        alt={`Excursion preview ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-md border border-admin-border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleImageDelete(index)}
                        className="bg-red-700 text-gray-200 border-admin-border hover:bg-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {errors.images && <p className="text-red-500 text-sm">{errors.images}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="isAvailable" className="text-white font-bold">Statut</Label>
            <Select
              value={formData.isAvailable ? 'available' : 'unavailable'}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, isAvailable: value === 'available' }))}
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
                setFormData({
                  _id: excursion?._id || '',
                  title: excursion?.title || '',
                  description: excursion?.description || '',
                  includedItems: excursion?.includedItems || [],
                  dailyProgram: excursion?.dailyProgram || [],
                  prices: excursion?.prices || { oneToFour: 0, fiveToSix: 0, sevenToEight: 0 },
                  duration: excursion?.duration || 0,
                  imageUrls: excursion?.imageUrls || [],
                  isAvailable: excursion?.isAvailable ?? true,
                  createdAt: excursion?.createdAt || '',
                });
                setPreviewUrls(
                  Array(5)
                    .fill('')
                    .map((_, i) => (excursion?.imageUrls[i] ? `${import.meta.env.VITE_API_IMG}${excursion.imageUrls[i]}` : ''))
                );
                setSelectedFiles(Array(5).fill(null));
                setImagesToDelete([]);
                setErrors({
                  title: '',
                  description: '',
                  includedItems: '',
                  dailyProgram: '',
                  oneToFour: '',
                  fiveToSix: '',
                  sevenToEight: '',
                  duration: '',
                  images: '',
                });
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

export default UpdateExcursionModal;