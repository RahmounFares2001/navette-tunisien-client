import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBlogMutation } from '@/globalRedux/features/api/apiSlice';
import { Upload } from 'lucide-react';
import { toast } from 'react-toastify';

const AddBlogModal = ({ open, onOpenChange, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [errors, setErrors] = useState({ title: '', description: '', image: '' });
  const [serverError, setServerError] = useState('');
  const [createBlog, { isLoading }] = useCreateBlogMutation();

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: "L'image ne doit pas dépasser 2 Mo" }));
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
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = { title: '', description: '', image: '' };
    let isValid = true;

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre du blog est requis';
      isValid = false;
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La description du blog est requise';
      isValid = false;
    }
    if (!formData.image) {
      newErrors.image = 'Veuillez sélectionner une image';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

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
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('image', formData.image);

      await createBlog(submitData).unwrap();
      onSave?.();
      onOpenChange(false);
      setFormData({ title: '', description: '', image: null });
      setPreviewUrl('');
      setErrors({ title: '', description: '', image: '' });
      setServerError('');
      toast.success('Blog ajouté avec succès', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } catch (error) {
      console.error('Failed to create blog:', error);
      const errorMessage = error?.data?.message || "Échec de l'ajout du blog";
      setServerError(errorMessage);
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
            Ajouter un Blog
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-admin-foreground">Titre du Blog</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
              required
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-admin-foreground">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
              required
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="image" className="text-admin-foreground">Image du Blog</Label>
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
                alt="Blog preview"
                className="w-full h-32 object-cover rounded-md border border-admin-border"
              />
            </div>
          )}
          {serverError && <p className="text-red-500 text-sm">{serverError}</p>}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-admin-foreground text-admin-bg hover:bg-gray-300 flex-1"
            >
              {isLoading ? 'Ajout en cours...' : 'Ajouter'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setPreviewUrl('');
                setErrors({ title: '', description: '', image: '' });
                setServerError('');
                setFormData({ title: '', description: '', image: null });
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

export default AddBlogModal;