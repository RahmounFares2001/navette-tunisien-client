import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetAllBlogsQuery } from '@/globalRedux/features/api/apiSlice';
import SeoConfig from '@/seo/SeoConfig';

const Blogs = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;
  const maxPages = 5;

  const { data: blogsData, isLoading, error } = useGetAllBlogsQuery({ page: 1, limit: 100, search: searchQuery });
  const blogs = blogsData?.data || [];
  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredBlogs.length;
  const totalPages = Math.min(maxPages, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBlogs = filteredBlogs.slice(startIndex, startIndex + itemsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground">{t('blogs.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{t('blogs.error')}</p>
      </div>
    );
  }

  const slugifyTitle = (title) => {
    return title
      .trim()
      .replace(/\s+/g, "-")          // espaces → tirets
      .replace(/:/g, "-")            // deux-points → tiret
      .replace(/[^\wÀ-ÿ-]/g, "");    // supprime caractères spéciaux
  };

  return (
    <>
      <SeoConfig
        title="Blog Navette Tunisie"
        description="Lisez nos articles sur les voyages en Tunisie, conseils pour transferts aéroport, excursions touristiques, et découvertes à Hammamet avec Navette Tunisie. Planifiez votre aventure avec nos guides experts."
        keywords="voyage Tunisie, tourisme Tunisie, guide transfert aéroport, guide excursions Tunisie, transfer Tunisie, excursion Tunisie, Hammamet"
        url="/blogs"
      />
      <div className="min-h-screen py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl font-extrabold text-foreground mb-2">
              {t('blogs.title')}
            </h1>
            <p className='text-center mt-4 text-xs sm:text-sm lg:text-base' >
              {t('blogs.desc')}
            </p>
            <div className="mt-6 flex justify-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('blogs.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-md border-gray-300 rounded-full shadow-sm focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>
          </motion.div>

          {filteredBlogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-foreground text-lg font-medium">{t('blogs.noAvailableBlogs')}</p>
            </div>
          )}

          {filteredBlogs.length > 0 && (
            <div className="space-y-4">
              {paginatedBlogs.map((blog, index) => (
                <motion.div
                  key={blog._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300
                          flex-col md:flex-row"
                >
                  <div className="w-full h-52 md:w-52 md:h-52 flex-shrink-0">
                    <img
                      src={`${import.meta.env.VITE_API_IMG}${blog.imgUrl}`}
                      alt={blog.title}
                      className="w-full h-full object-cover rounded-l-xl"
                    />
                  </div>
                  <div className="flex-1 flex-col gap-3 md:gap-0 md:flex-row p-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm sm:text-lg font-bold text-foreground hover:text-primary transition-colors">
                        {blog.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link to={`/blogs/${blog._id}/${slugifyTitle(blog.title)}`}>
                      <Button className="bg-primary hover:bg-primary-hover rounded-full px-6">
                        {t('blogs.readMore')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center items-center gap-4 mt-12"
            >
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                variant="outline"
                className="flex items-center border-gray-300 rounded-full px-4 hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('blogs.previous')}
              </Button>
              <span className="text-foreground font-medium">
                {t('blogs.page', { current: currentPage, total: totalPages })}
              </span>
              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                variant="outline"
                className="text-xs md:text-sm flex items-center border-gray-300 rounded-full px-4 hover:bg-gray-100"
              >
                {t('blogs.next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg sm:text-xl md::text-2xl font-bold text-foreground mb-3">
                {t('blogs.contactUs.title')}
              </h2>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto
                    text-xs sm:text-sm lg:mtext-base">
                {t('blogs.contactUs.description')}
              </p>
              <Link to="/contact" onClick={() => window.scrollTo(0, 0)}>
                <Button size="lg" className="text-xs md:text-sm bg-primary hover:bg-primary-hover rounded-full">
                  {t('blogs.contactUs.button')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Blogs;