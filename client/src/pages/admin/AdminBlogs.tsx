import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import AdminLayout from '@/components/admin/AdminLayout';
import AddBlogModal from '@/components/admin/modals/blog/AddBlogModal';
import UpdateBlogModal from '@/components/admin/modals/blog/UpdateBlogModal';
import { useGetAllBlogsQuery, useDeleteBlogMutation } from '@/globalRedux/features/api/apiSlice';
import { IBlogResponse } from '@/types/types';
import { toast } from 'react-toastify';

const AdminBlogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<IBlogResponse | undefined>(undefined);
  const [blogToDelete, setBlogToDelete] = useState<IBlogResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [blogs, setBlogs] = useState<IBlogResponse[]>([]);

  const { data: blogsData, isLoading } = useGetAllBlogsQuery({ page: currentPage, limit: 10, search: searchTerm }, { skip: !isMounted, pollingInterval: 30000 });
  const [deleteBlog] = useDeleteBlogMutation();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (blogsData?.data) {
      setBlogs(blogsData.data.map(blog => ({
        ...blog,
        imgUrl: `${blog.imgUrl}?t=${Date.now()}`
      })));
    }
  }, [blogsData]);

  const totalPages = Math.min(blogsData?.totalPages || 1, 5);

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddBlog = () => {
    setAddModalOpen(true);
  };

  const handleEditBlog = (blog: IBlogResponse) => {
    setSelectedBlog(blog);
    setUpdateModalOpen(true);
  };

  const handleDeleteBlog = (blog: IBlogResponse) => {
    setBlogToDelete(blog);
    setDeleteModalOpen(true);
  };

  const confirmDeleteBlog = async () => {
    if (blogToDelete) {
      try {
        await deleteBlog(blogToDelete._id).unwrap();
        setBlogs(blogs.filter(b => b._id !== blogToDelete._id));
        toast.success('Blog supprimé avec succès', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } catch (error) {
        console.error('Failed to delete blog:', error);
        toast.error('Échec de la suppression du blog', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      }
    }
    setDeleteModalOpen(false);
    setBlogToDelete(null);
  };

  const handleSaveBlog = (updatedBlog?: IBlogResponse) => {
    if (updatedBlog) {
      setBlogs(prevBlogs => prevBlogs.map(b => b._id === updatedBlog._id ? { ...updatedBlog, imgUrl: `${updatedBlog.imgUrl}?t=${Date.now()}` } : b));
    }
    setAddModalOpen(false);
    setUpdateModalOpen(false);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setPageInput('');
    }
  };

  const handlePageInputSubmit = () => {
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
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
              Gestion des Blogs
            </h1>
            <Button 
              onClick={handleAddBlog}
              className="bg-admin-foreground text-admin-bg hover:bg-gray-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
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
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-admin-bg border-admin-border text-admin-foreground focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBlogs.map((blog) => (
                <Card key={blog._id} className="bg-admin-card border-admin-border">
                  <CardContent className="p-4">
                    <div className="relative mb-3">
                      <img
                        src={`${import.meta.env.VITE_API_IMG}${blog.imgUrl}`}
                        alt={blog.title}
                        className="w-full h-32 object-cover rounded-md"
                        onError={(e) => console.error(`Failed to load image for ${blog.title}: ${import.meta.env.VITE_API_IMG}${blog.imgUrl}`)}
                      />
                    </div>
                    <div className='flex justify-between'>
                      <h3 className="font-semibold text-sm text-admin-foreground">{blog.title}</h3>
                    </div>
                    <div className="flex space-x-2 pt-3 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditBlog(blog)}
                        className="bg-yellow-600 hover:text-gray-900 text-admin-foreground border-admin-border hover:bg-yellow-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteBlog(blog)}
                        className="bg-red-700 text-gray-100 hover:text-gray-100 border-admin-border hover:bg-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center space-x-2"
          >
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-admin-bg text-admin-foreground hover:bg-gray-300 border-admin-border"
            >
              Précédent
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                onClick={() => handlePageChange(page)}
                className={currentPage === page ? 'bg-admin-foreground text-admin-bg' : 'bg-admin-bg text-admin-foreground hover:bg-gray-300 border-admin-border'}
              >
                {page}
              </Button>
            ))}
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
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
          </motion.div>

          <AddBlogModal
            open={addModalOpen}
            onOpenChange={setAddModalOpen}
            onSave={handleSaveBlog}
          />
          <UpdateBlogModal
            open={updateModalOpen}
            onOpenChange={setUpdateModalOpen}
            blog={selectedBlog}
            onSave={handleSaveBlog}
          />

          <Dialog open={deleteModalOpen} onOpenChange={() => setDeleteModalOpen(false)}>
            <DialogContent className="max-w-md bg-admin-card border-admin-border">
              <DialogHeader>
                <DialogTitle className="text-admin-foreground text-xl font-bold">
                  Confirmer la Suppression
                </DialogTitle>
                <DialogDescription className="text-admin-foreground">
                  Êtes-vous sûr de vouloir supprimer ce blog ? Cette action est irréversible.
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
                  onClick={confirmDeleteBlog}
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

export default AdminBlogs;