import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useGetAllExcursionsQuery } from '@/globalRedux/features/api/apiSlice';
import excursionSample from '@/assets/excursion-sample.jpg';
import SeoConfig from '@/seo/SeoConfig';
import { CurrencyContext } from '@/components/currency/CurrencyContext';

const Excursions = () => {
  const { t } = useTranslation();
  const { currency, exchangeRates } = useContext(CurrencyContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 6;
  const maxPages = 2;

  const { data: excursionsData, isLoading, error } = useGetAllExcursionsQuery({ page: 1, limit: 100, search: '' });
  const availableExcursions = excursionsData?.data?.filter(exc => exc.isAvailable) || [];
  const filteredExcursions = availableExcursions.filter(exc =>
    exc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredExcursions.length;
  const totalPages = Math.min(maxPages, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExcursions = filteredExcursions.slice(startIndex, startIndex + itemsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const getPrice = (priceInTND: number) => {
    return (currency === 'TND' ? priceInTND : priceInTND * exchangeRates[currency]).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground">{t('excursions.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{t('excursions.error')}</p>
      </div>
    );
  }

  return (
    <>
      <SeoConfig
        title="Excursions Touristiques en Tunisie - Navette Tunisie"
        description="Découvrez les meilleures excursions en Tunisie avec Navette Tunisie. Visites guidées, circuits culturels et aventures inoubliables."
        keywords="excursions Tunisie, circuits touristiques Tunisie, Navette Tunisie, tourisme Tunisie, visite guidée Tunisie"
        url="/excursions"
      />
      <div className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('excursions.title')}
            </h1>
            <p className="text-md sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('excursions.description')}
            </p>
            <div className="mt-6 flex justify-center gap-4 max-w-md mx-auto">
              <Input
                type="text"
                placeholder={t('excursions.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm sm:text-md"
              />
            </div>
          </motion.div>

          {filteredExcursions.length === 0 && (
            <div className="flex justify-center items-center mb-8">
              <p className="text-foreground">{t('excursions.noAvailableExcursions')}</p>
            </div>
          )}

          {filteredExcursions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedExcursions.map((excursion, index) => (
                <motion.div
                  key={excursion._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="p-0 card-elegant h-full overflow-hidden group">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={`${import.meta.env.VITE_API_IMG}${excursion.imageUrls[0]}` || excursionSample}
                        alt={excursion.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute top-4 right-4 space-y-2">
                        <Badge className="rounded px-3 py-1 bg-secondary text-secondary-foreground font-bold">
                          {getPrice(excursion.prices.oneToFour)} {currency}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <div className="flex items-center text-white text-sm space-x-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {excursion.duration} {t('excursions.hours')}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {t('excursions.maxPeople')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-3 text-foreground">
                        {excursion.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          {t('excursions.location')}
                        </div>
                        <Link to={`/excursion/${excursion._id}`}>
                          <Button className="bg-primary hover:bg-primary-hover">
                            {t('excursions.reserve')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center items-center gap-4 mt-8"
            >
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                variant="outline"
                className="flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('excursions.previous')}
              </Button>
              <span className="text-foreground">
                {t('excursions.page', { current: currentPage, total: totalPages })}
              </span>
              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                variant="outline"
                className="flex items-center"
              >
                {t('excursions.next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <div className="bg-gradient-sand rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t("customExcursion.title")}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {t("customExcursion.description")}
              </p>
              <Link to="/contact" onClick={() => window.scrollTo(0, 0)}>
                <Button size="lg" className="btn-hero">
                  {t("customExcursion.button")}
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

export default Excursions;