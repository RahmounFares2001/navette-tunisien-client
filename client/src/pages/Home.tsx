import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, MapPin, Users, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import heroImage from '@/assets/hero-tunisia.jpg';
import excursionSample from '@/assets/excursion-sample.jpg';
import transferVehicle from '@/assets/transfer-vehicle.jpg';
import axios from 'axios';
import SeoConfig from '@/seo/SeoConfig';

const Home = () => {
  const { t } = useTranslation();

  const services = [
    {
      title: t('services.transfers.title'),
      description: t('services.transfers.description'),
      icon: Car,
      image: transferVehicle,
      link: '/transfers',
      cta: t('services.transfers.cta')
    },
    {
      title: t('services.excursions.title'),
      description: t('services.excursions.description'),
      icon: MapPin,
      image: excursionSample,
      link: '/excursions',
      cta: t('services.excursions.cta')
    }
  ];

  const features = [
    { icon: Users, title: t("features.feature1.title"), description: t("features.feature1.description") },
    { icon: Star, title: t("features.feature2.title"), description: t("features.feature2.description") },
    { icon: MapPin, title: t("features.feature3.title"), description: t("features.feature3.description") }
  ];

  const testimonials = [
    {
      name: 'Marie Dubois',
      text: 'Excellent service ! Le transfert était ponctuel et confortable.',
      rating: 5
    },
    {
      name: 'Ahmed Ben Ali',
      text: 'Une excursion magnifique avec un guide très compétent.',
      rating: 5
    },
    {
      name: 'John Smith',
      text: 'Professional service and beautiful discovery of Tunisia.',
      rating: 5
    }
  ];


  return (
    <>
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/transfers" onClick={() => window.scrollTo(0, 0)} >
                <Button size="lg" className="bg-orange-700">
                  {t('hero.cta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/excursions" onClick={() => window.scrollTo(0, 0)} >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/10 text-white border-white hover:bg-white hover:text-foreground backdrop-blur-sm"
                >
                  {t('hero.discoverExcursions')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('services.title')}
            </h2>
            <p className="text-md sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('services.description')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="card-elegant h-full overflow-hidden group">
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                      <service.icon className="h-8 w-8 text-white mb-2" />
                    </div>
                  </div>
                  <CardContent className="p-3 sm:p-6">
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">
                      {service.title}
                    </h3>
                    <p className="text-sm sm:text-lg text-muted-foreground mb-6">
                      {service.description}
                    </p>
                    <Link to={service.link}>
                      <Button className="w-full bg-primary hover:bg-primary-hover"
                            onClick={() => window.scrollTo(0, 0)} >
                        {service.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('features.title')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-gradient-hero text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-lg text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('testimonialsTitle')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="card-elegant">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-secondary fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">
                      "{testimonial.text}"
                    </p>
                    <p className="font-semibold text-foreground">
                      - {testimonial.name}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
    </>

  );
};

export default Home;