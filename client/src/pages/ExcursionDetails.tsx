import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users, MapPin, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import excursionSample from '@/assets/excursion-sample.jpg';

const ExcursionDetails = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    numberOfPeople: 1,
    message: ''
  });

  // Mock excursion data - in real app, this would be fetched based on ID
  const excursion = {
    id: id || '1',
    title: 'Carthage et Sidi Bou Saïd',
    description: 'Plongez dans l\'histoire millénaire de Carthage, ancienne rivale de Rome, et découvrez les vestiges fascinants de cette civilisation disparue. Les ruines des thermes d\'Antonin, du quartier punique et du musée de Carthage vous transporteront dans le temps. Ensuite, flânez dans les ruelles pavées de Sidi Bou Saïd, ce village perché sur une falaise dominant la mer. Ses maisons blanches aux volets bleus, ses cafés traditionnels et ses vues panoramiques sur le golfe de Tunis en font un lieu magique et romantique.',
    fullDescription: 'Cette excursion exceptionnelle vous invite à explorer deux joyaux du patrimoine tunisien. Commencez votre journée par la visite des ruines de Carthage, site classé au patrimoine mondial de l\'UNESCO. Accompagné d\'un guide expert, vous découvrirez l\'histoire fascinante de cette ancienne cité punique et romaine. Visitez les thermes d\'Antonin, parmi les plus grands thermes romains au monde, le quartier punique avec ses fondations d\'habitations carthaginoises, et le musée national de Carthage qui abrite une riche collection d\'objets archéologiques.\n\nAprès le déjeuner dans un restaurant local, direction Sidi Bou Saïd, surnommé le "Saint-Tropez tunisien". Ce village pittoresque, perché à 130 mètres au-dessus de la mer, vous séduira par son architecture unique : maisons blanches aux volets et portes bleu cobalt, ruelles pavées fleuries de bougainvillées, et cafés mauresques où le temps semble suspendu. Ne manquez pas la visite du café des Nattes, rendu célèbre par de nombreux artistes et intellectuels.\n\nLe point culminant de votre visite sera la vue spectaculaire depuis le phare de Sidi Bou Saïd sur le golfe de Tunis et la marina de plaisance. Cette excursion allie parfaitement culture, histoire et beauté naturelle pour une expérience inoubliable.',
    price: 80,
    duration: '6 heures',
    images: [excursionSample, excursionSample, excursionSample, excursionSample, excursionSample],
    maxPeople: 8,
    rating: 4.8,
    reviews: 127,
    included: [
      'Guide professionnel francophone',
      'Transport climatisé',
      'Entrées aux sites archéologiques',
      'Déjeuner traditionnel',
      'Eau minérale'
    ],
    itinerary: [
      '09:00 - Départ de votre hôtel',
      '10:00 - Visite des ruines de Carthage',
      '12:30 - Déjeuner à Sidi Bou Saïd',
      '14:00 - Exploration du village',
      '15:30 - Temps libre et shopping',
      '16:30 - Retour à votre hôtel'
    ]
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % excursion.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + excursion.images.length) % excursion.images.length);
  };

  const handleSubmit = () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (formData.numberOfPeople > excursion.maxPeople) {
      toast({
        title: "Erreur",
        description: `Maximum ${excursion.maxPeople} personnes par excursion`,
        variant: "destructive",
      });
      return;
    }

    // Mock form submission
    console.log('Excursion booking:', { excursionId: id, ...formData });
    
    toast({
      title: "Succès",
      description: t('excursions.confirmationMessage'),
    });

    // Reset form
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      numberOfPeople: 1,
      message: ''
    });
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link to="/excursions">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('excursionDetails.backButton')}
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Excursion Details */}
          <div className="lg:col-span-2">
            {/* Image Carousel */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative h-96 rounded-2xl overflow-hidden mb-8"
            >
              <img
                src={excursion.images[currentImageIndex]}
                alt={`${excursion.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              
              {/* Navigation Arrows */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-2 transition-all"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-2 transition-all"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
              
              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {excursion.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>

              {/* Price Badge */}
              <div className="absolute top-4 right-4">
                <Badge className="rounded bg-secondary text-secondary-foreground font-bold text-lg px-4 py-2">
                  {excursion.price} DT
                </Badge>
              </div>
            </motion.div>

            {/* Excursion Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-3 card-elegant mb-8">
                <CardContent className="p-0 sm:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
                        {excursion.title}
                      </h1>
                      <div className="flex sm:items-center space-y-1 sm:space-y-0 sm:space-x-6 text-muted-foreground
                              flex-col sm:flex-row">
                        <div className="text-sm sm:text-lg flex items-center">
                          <Clock className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                          {t('excursions.duration')}: {excursion.duration}
                        </div>
                        <div className="text-sm sm:text-lg flex items-center">
                          <Users className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                          {t('excursions.maxPeople')}
                        </div>
                        <div className="text-sm sm:text-lg flex items-center">
                          <MapPin className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                          Tunisie
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="prose max-w-none">
                    <p className="text-muted-foreground text-sm text-justify sm:text-md leading-relaxed mb-6">
                      {excursion.description}
                    </p>
                    
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Description Complète</h3>
                    <div className="text-sm sm:text-md text-justify text-muted-foreground leading-relaxed whitespace-pre-line">
                      {excursion.fullDescription}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What's Included */}
              <Card className="card-elegant mb-8">
                <CardContent className="p-0 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Ce qui est inclus</h3>
                  <ul className="space-y-2">
                    {excursion.included.map((item, index) => (
                      <li key={index} className="flex items-center text-muted-foreground
                                    text-sm sm:text-md">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Itinerary */}
              <Card className="card-elegant">
                <CardContent className="p-0 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Programme de la Journée</h3>
                  <div className="space-y-4">
                    {excursion.itinerary.map((item, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-3 h-3 bg-primary rounded-full mr-4 mt-2 flex-shrink-0"></div>
                        <span className="text-sm sm:text-md text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="sticky top-24"
            >
              <Card className="p-3 card-elegant">
                <CardContent className="p-0 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">
                    {t('excursionDetails.title')}
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <Label htmlFor="fullName">{t('forms.fullName')} *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder={t('contact.inputName')}
                        className='text-sm sm:text-md'
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email">{t('forms.email')} *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="...@email.com"
                        className='text-sm sm:text-md'
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <Label htmlFor="phone">{t('forms.phone')} *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+..."
                        className='text-sm sm:text-md'
                      />
                    </div>

                    {/* Number of People */}
                    <div>
                      <Label htmlFor="numberOfPeople">{t('excursions.numberOfPeople')} *</Label>
                      <Input
                        id="numberOfPeople"
                        type="number"
                        min="1"
                        max={excursion.maxPeople}
                        value={formData.numberOfPeople}
                        className='text-sm sm:text-md'
                        onChange={(e) => setFormData(prev => ({ ...prev, numberOfPeople: parseInt(e.target.value) || 1 }))}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        8 {t('excursionDetails.maxPersons')}
                      </p>
                    </div>

                    {/* Message */}
                    <div>
                      <Label htmlFor="message">{t('forms.message')}</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        className='text-sm sm:text-md'
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder={t('contact.inputMessage')}
                        rows={3}
                      />
                    </div>

                    {/* Total Price */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>{t('excursionDetails.total')}:</span>
                        <span className="text-primary">
                          {excursion.price} DT
                        </span>
                      </div>

                    </div>

                    {/* Submit Button */}
                    <Button 
                      onClick={handleSubmit}
                      size="lg"
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {t('excursions.reserve')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcursionDetails;