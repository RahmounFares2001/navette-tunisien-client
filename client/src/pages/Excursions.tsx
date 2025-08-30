import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import excursionSample from '@/assets/excursion-sample.jpg';

interface Excursion {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  image: string;
  maxPeople: number;
}

const Excursions = () => {
  const { t } = useTranslation();

  // Mock excursions data
  const excursions: Excursion[] = [
    {
      id: '1',
      title: 'Carthage et Sidi Bou Saïd',
      description: 'Découvrez les ruines antiques de Carthage et le charme de Sidi Bou Saïd',
      price: 80,
      duration: '6 heures',
      image: excursionSample,
      maxPeople: 8
    },
    {
      id: '2',
      title: 'Excursion dans le Sahara',
      description: 'Aventure inoubliable dans le désert tunisien avec nuit sous les étoiles',
      price: 250,
      duration: '2 jours',
      image: excursionSample,
      maxPeople: 8
    },
    {
      id: '3',
      title: 'Kairouan - Ville Sainte',
      description: 'Explorez la première capitale de la Tunisie musulmane et ses mosquées',
      price: 120,
      duration: '8 heures',
      image: excursionSample,
      maxPeople: 8
    },
    {
      id: '4',
      title: 'El Jem et Sousse',
      description: 'Amphithéâtre romain d\'El Jem et la médina historique de Sousse',
      price: 100,
      duration: '10 heures',
      image: excursionSample,
      maxPeople: 8
    },
    {
      id: '5',
      title: 'Dougga - Site Archéologique',
      description: 'Le mieux préservé des sites romains en Afrique du Nord',
      price: 90,
      duration: '7 heures',
      image: excursionSample,
      maxPeople: 8
    },
    {
      id: '6',
      title: 'Hammamet et Nabeul',
      description: 'Plages magnifiques et artisanat traditionnel de poterie',
      price: 70,
      duration: '5 heures',
      image: excursionSample,
      maxPeople: 8
    }
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('excursions.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez les merveilles de la Tunisie avec nos excursions guidées
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {excursions.map((excursion, index) => (
            <motion.div
              key={excursion.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="card-elegant h-full overflow-hidden group">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={excursion.image} 
                    alt={excursion.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-secondary text-secondary-foreground font-bold">
                      {excursion.price} DT
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center text-white text-sm space-x-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {excursion.duration}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Max {excursion.maxPeople}
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    {excursion.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    {excursion.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      Tunisie
                    </div>
                    <Link to={`/excursion/${excursion.id}`}>
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

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-sand rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Excursion Personnalisée ?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Vous avez des demandes spécifiques ? Nous pouvons organiser une excursion sur mesure selon vos préférences.
            </p>
            <Link to="/contact">
              <Button size="lg" className="btn-hero">
                Contactez-Nous
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Excursions;