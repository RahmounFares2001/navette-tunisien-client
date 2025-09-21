import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateBlogMutation } from '@/globalRedux/features/api/apiSlice';
import { IBlogResponse } from '@/types/types';
import { Upload } from 'lucide-react';
import { toast } from 'react-toastify';

const UpdateBlogModal = ({ open, onOpenChange, blog, onSave }) => {
  const [formData, setFormData] = useState({
    _id: blog?._id || '',
    title: blog?.title || '',
    description: blog?.description || '',
    imgUrl: blog?.imgUrl || '',
    createdAt: blog?.createdAt || '',
  });
  const [previewUrl, setPreviewUrl] = useState(blog?.imgUrl ? `${import.meta.env.VITE_API_IMG}${blog.imgUrl}` : '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({ title: '', description: '', image: '' });
  const [updateBlog, { isLoading }] = useUpdateBlogMutation();

  useEffect(() => {
    if (blog) {
      setFormData({
        _id: blog._id,
        title: blog.title,
        description: blog.description,
        imgUrl: blog.imgUrl,
        createdAt: blog.createdAt,
      });
      setPreviewUrl(blog.imgUrl ? `${import.meta.env.VITE_API_IMG}${blog.imgUrl}` : '');
      setSelectedFile(null);
      setErrors({ title: '', description: '', image: '' });
    }
  }, [blog]);

  const handleImageUpload = (e) => {
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
    if (!formData.imgUrl && !selectedFile) {
      newErrors.image = 'Veuillez sélectionner une image';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
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
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      if (selectedFile) {
        submitData.append('image', selectedFile);
      }

      const response = await updateBlog({ id: formData._id, data: submitData }).unwrap();
      const updatedBlog = response.data;
      setFormData(updatedBlog);
      setPreviewUrl(updatedBlog.imgUrl ? `${import.meta.env.VITE_API_IMG}${updatedBlog.imgUrl}?t=${Date.now()}` : '');
      setSelectedFile(null);
      onSave?.(updatedBlog);
      onOpenChange(false);
      setErrors({ title: '', description: '', image: '' });
      toast.success('Blog mis à jour avec succès', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } catch (error) {
      console.error('Failed to update blog:', error);
      const errorMessage = error?.data?.message || 'Échec de la mise à jour du blog';
      setErrors(prev => ({ ...prev, title: errorMessage }));
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
            Modifier le Blog
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
                setErrors({ title: '', description: '', image: '' });
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

export default UpdateBlogModal;