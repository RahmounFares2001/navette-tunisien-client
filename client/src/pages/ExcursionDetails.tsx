import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users, MapPin, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useGetExcursionQuery, useCreateExcursionRequestMutation } from '@/globalRedux/features/api/apiSlice';
import { CreateExcursionRequest } from '@/types/types';
import excursionSample from '@/assets/excursion-sample.jpg';
import axios from 'axios';
import SeoConfig from '@/seo/SeoConfig';

const ExcursionDetails = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    numberOfAdults: 1,
    numberOfChildren: 0,
    numberOfBabies: 0,
    excursionDate: '',
    excursionTime: '',
    message: '',
    excursionId: id || '',
    paymentPercentage: 0,
    withGuide: false,
    driverLanguages: '',
  });
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedDescription, setTranslatedDescription] = useState('');
  const [translatedIncludedItems, setTranslatedIncludedItems] = useState<string[]>([]);
  const [translatedDailyProgram, setTranslatedDailyProgram] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const { data: excursionData, isLoading, error } = useGetExcursionQuery(id || '');
  const [createExcursionRequest, { isLoading: isSubmitting }] = useCreateExcursionRequestMutation();
  const excursion = excursionData?.data;

  const [totalPrice, setTotalPrice] = useState(0);

  // Calculate maximum allowed values for each input based on the sum of the others
  const maxAdults = 8 - formData.numberOfChildren - formData.numberOfBabies;
  const maxChildren = 8 - formData.numberOfAdults - formData.numberOfBabies;
  const maxBabies = 8 - formData.numberOfAdults - formData.numberOfChildren;

  // Translation logic with caching
 // Super fast parallel translation - replace your useEffect with this
useEffect(() => {
  if (!excursion) return;

  const cacheKey = `excursion_${excursion._id}_${i18n.language}_v3`; // v3 for faster version
  
  // Fast Google Translate with minimal delays
  const translateWithGoogle = async (text, targetLang) => {
    try {
      // For very long texts, split smartly but with larger chunks
      const maxChunkSize = 4500;
      const chunks = [];
      
      if (text.length <= maxChunkSize) {
        chunks.push(text);
      } else {
        // Quick sentence-based splitting
        const sentences = text.split(/(?<=[.!?])\s+/);
        let currentChunk = '';
        
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          }
        }
        if (currentChunk) chunks.push(currentChunk.trim());
      }
      
      // Translate all chunks in parallel for speed
      const chunkPromises = chunks.map(async (chunk, index) => {
        // Stagger requests slightly to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, index * 300));
        
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${targetLang}&dt=t&q=${encodeURIComponent(chunk)}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        let result = '';
        if (data && Array.isArray(data) && data[0] && Array.isArray(data[0])) {
          for (const segment of data[0]) {
            if (Array.isArray(segment) && segment[0]) {
              result += segment[0];
            }
          }
        }
        
        return result || chunk;
      });
      
      const translatedChunks = await Promise.all(chunkPromises);
      return translatedChunks.join('');
      
    } catch (error) {
      console.warn('Google translate failed:', error);
      throw error;
    }
  };

  // Fast translation with immediate fallback
  const translateText = async (text, targetLang) => {
    if (text.length < 5) return text;
    
    try {
      const result = await translateWithGoogle(text, targetLang);
      if (result && result.length > text.length * 0.2) {
        return result;
      }
    } catch (error) {
      console.warn('Translation failed, using original:', error);
    }
    
    return text; // Quick fallback to original
  };

  // Translate everything in parallel for maximum speed
  const translateFields = async () => {
    setIsTranslating(true);
    const targetLang = i18n.language;
    
    console.log(`🚀 Fast translation to ${targetLang}`);

    if (targetLang === 'fr') {
      setTranslatedTitle(excursion.title);
      setTranslatedDescription(excursion.description);
      setTranslatedIncludedItems(excursion.includedItems);
      setTranslatedDailyProgram(excursion.dailyProgram);
      setIsTranslating(false);
      return;
    }

    // Check cache first
    try {
      const cachedTranslation = localStorage.getItem(cacheKey);
      if (cachedTranslation) {
        const parsed = JSON.parse(cachedTranslation);
        if (parsed.description && parsed.description.length > 200) {
          console.log('📦 Using cached translation');
          setTranslatedTitle(parsed.title);
          setTranslatedDescription(parsed.description);
          setTranslatedIncludedItems(parsed.includedItems);
          setTranslatedDailyProgram(parsed.dailyProgram);
          setIsTranslating(false);
          return;
        }
      }
    } catch (e) {
      // Ignore cache errors
    }

    try {
      console.log('⚡ Starting parallel translations...');
      
      // Translate EVERYTHING in parallel for maximum speed
      const results = await Promise.all([
        translateText(excursion.title, targetLang),
        translateText(excursion.description, targetLang),
        ...excursion.includedItems.map(item => translateText(item, targetLang)),
        ...excursion.dailyProgram.map(item => translateText(item, targetLang))
      ]);

      // Extract results
      const translatedTitle = results[0];
      const translatedDescription = results[1];
      const translatedIncludedItems = results.slice(2, 2 + excursion.includedItems.length);
      const translatedDailyProgram = results.slice(2 + excursion.includedItems.length);

      console.log('✅ All translations done in parallel!');

      // Update UI immediately
      setTranslatedTitle(translatedTitle);
      setTranslatedDescription(translatedDescription);
      setTranslatedIncludedItems(translatedIncludedItems);
      setTranslatedDailyProgram(translatedDailyProgram);

      // Cache in background (non-blocking)
      setTimeout(() => {
        try {
          const cacheData = {
            title: translatedTitle,
            description: translatedDescription,
            includedItems: translatedIncludedItems,
            dailyProgram: translatedDailyProgram,
            timestamp: Date.now()
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (e) {
          // Ignore cache errors
        }
      }, 100);
      
    } catch (error) {
      console.error('Translation failed:', error);
      // Quick fallback
      setTranslatedTitle(excursion.title);
      setTranslatedDescription(excursion.description);
      setTranslatedIncludedItems(excursion.includedItems);
      setTranslatedDailyProgram(excursion.dailyProgram);
    }
    
    setIsTranslating(false);
  };

  translateFields();
}, [excursion, i18n.language, toast]);

  useEffect(() => {
    if (excursion) {
      const totalPeople = formData.numberOfAdults + formData.numberOfChildren + formData.numberOfBabies;
      let price;
      if (totalPeople >= 1 && totalPeople <= 4) {
        price = excursion.prices.oneToFour;
      } else if (totalPeople >= 5 && totalPeople <= 6) {
        price = excursion.prices.fiveToSix;
      } else if (totalPeople >= 7 && totalPeople <= 8) {
        price = excursion.prices.sevenToEight;
      } else {
        price = 0;
      }
      if (formData.withGuide) {
        price += 200;
      }
      setTotalPrice(price);
    } else {
      setTotalPrice(0);
    }
  }, [formData.numberOfAdults, formData.numberOfChildren, formData.numberOfBabies, formData.withGuide, excursion]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (excursion?.imageUrls.length || 1));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + (excursion?.imageUrls.length || 1)) % (excursion?.imageUrls.length || 1));
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.clientEmail || !formData.clientPhone || !formData.excursionDate || !formData.excursionTime) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const totalPeople = formData.numberOfAdults + formData.numberOfChildren + formData.numberOfBabies;
    if (totalPeople < 1 || totalPeople > 8) {
      toast({
        title: "Erreur",
        description: "Le nombre total de personnes doit être entre 1 et 8",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.numberOfAdults < 0 ||
      formData.numberOfChildren < 0 ||
      formData.numberOfBabies < 0 ||
      formData.numberOfAdults > 8 ||
      formData.numberOfChildren > 8 ||
      formData.numberOfBabies > 8
    ) {
      toast({
        title: "Erreur",
        description: "Les nombres d'adultes, d'enfants et de bébés doivent être entre 0 et 8",
        variant: "destructive",
      });
      return;
    }

    if (formData.withGuide && !formData.driverLanguages.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier les langues souhaitées pour le guide",
        variant: "destructive",
      });
      return;
    }

    try {
      const data: CreateExcursionRequest = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        excursionDate: formData.excursionDate,
        excursionTime: formData.excursionTime,
        numberOfAdults: formData.numberOfAdults,
        numberOfChildren: formData.numberOfChildren,
        numberOfBabies: formData.numberOfBabies,
        message: formData.message,
        excursionId: formData.excursionId,
        paymentPercentage: 0,
        withGuide: formData.withGuide,
        driverLanguages: formData.driverLanguages,
      };

      await createExcursionRequest(data).unwrap();
      setIsSuccess(true);
      toast({
        title: "Succès",
        description: t('excursions.confirmationMessage'),
      });
    } catch (err) {
      console.error('Failed to create excursion request:', err);
      toast({
        title: "Erreur",
        description: "Échec de la création de la demande d'excursion",
        variant: "destructive",
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <Card className="p-3 card-elegant">
            <CardContent className="p-0 sm:p-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4">{t('excursionDetails.successMessage')}</h2>
              <Link to="/excursions">
                <Button
                  variant="outline"
                  className="flex items-center mx-auto"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('excursionDetails.backToExcursions')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground">Chargement...</p>
      </div>
    );
  }

  if (error || !excursion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Erreur de chargement de l'excursion</p>
      </div>
    );
  }

  return (
    <>
    <SeoConfig
      title="Détails de l'Excursion - Navette Tunisie"
      description="Explorez les détails de nos excursions touristiques en Tunisie avec Navette Tunisie. Réservez votre aventure dès maintenant."
      keywords="excursion Tunisie, visite guidée Tunisie, Navette Tunisie, tourisme Tunisie, circuit culturel Tunisie"
      url="/excursion/:id"
    />
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative h-96 rounded-2xl overflow-hidden mb-8"
            >
              <img
                src={`${import.meta.env.VITE_API_IMG}${excursion.imageUrls[currentImageIndex]}` || excursionSample}
                alt={`${excursion.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              
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
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {excursion.imageUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>

              <div className="absolute top-4 right-4">
                <Badge className="rounded bg-secondary text-secondary-foreground font-bold text-lg px-4 py-2">
                  {totalPrice} DT
                </Badge>
              </div>
            </motion.div>

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
                        {isTranslating ? 'Translating...' : translatedTitle}
                      </h1>
                      <div className="flex sm:items-center space-y-1 sm:space-y-0 sm:space-x-6 text-muted-foreground flex-col sm:flex-row">
                        <div className="text-sm sm:text-lg flex items-center">
                          <Clock className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                          {t('excursions.duration')}: {excursion.duration} {t('excursionDetails.hours')}
                        </div>
                        <div className="text-sm sm:text-lg flex items-center">
                          <Users className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                          {t('excursionDetails.max')} 8
                        </div>
                        <div className="text-sm sm:text-lg flex items-center">
                          <MapPin className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                          {t('excursionDetails.tunisie')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">{t('excursionDetails.desc')}</h3>
                    <div className="text-sm sm:text-md text-justify text-muted-foreground leading-relaxed whitespace-pre-line">
                      {isTranslating ? 'Translating...' : translatedDescription}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elegant mb-8">
                <CardContent className="p-0 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">{t('excursionDetails.included')}</h3>
                  <ul className="space-y-2">
                    {isTranslating ? (
                      <li className="text-sm sm:text-md text-muted-foreground">Translating...</li>
                    ) : (
                      translatedIncludedItems?.map((item, index) => (
                        <li key={index} className="flex items-center text-muted-foreground text-sm sm:text-md">
                          <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                          {item}
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardContent className="p-0 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">{t('excursionDetails.dayProgram')}</h3>
                  <div className="space-y-4">
                    {isTranslating ? (
                      <div className="text-sm sm:text-md text-muted-foreground">Translating...</div>
                    ) : (
                      translatedDailyProgram?.map((item, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-3 h-3 bg-primary rounded-full mr-4 mt-2 flex-shrink-0"></div>
                          <span className="text-sm sm:text-md text-muted-foreground">{item}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

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
                    <div>
                      <Label htmlFor="clientName">{t('forms.fullName')} *</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                        placeholder={t('contact.inputName')}
                        className="text-sm sm:text-md"
                      />
                    </div>

                    <div>
                      <Label htmlFor="clientEmail">{t('forms.email')} *</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                        placeholder="...@email.com"
                        className="text-sm sm:text-md"
                      />
                    </div>

                    <div>
                      <Label htmlFor="clientPhone">{t('forms.phone')} *</Label>
                      <Input
                        id="clientPhone"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                        placeholder="+..."
                        className="text-sm sm:text-md"
                      />
                    </div>

                    <div>
                      <Label htmlFor="excursionDate">{t('excursionDetails.date')} *</Label>
                      <Input
                        id="excursionDate"
                        type="date"
                        value={formData.excursionDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, excursionDate: e.target.value }))}
                        className="text-sm sm:text-md"
                      />
                    </div>

                    <div>
                      <Label htmlFor="excursionTime">{t('excursionDetails.time')} *</Label>
                      <Input
                        id="excursionTime"
                        type="time"
                        value={formData.excursionTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, excursionTime: e.target.value }))}
                        className="text-sm sm:text-md"
                      />
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mt-1">
                        1-4 {t('excursionDetails.personnes')}: ({excursion.prices.oneToFour} DT)<br />
                        5-6 {t('excursionDetails.personnes')}: ({excursion.prices.fiveToSix} DT)<br />
                        7-8 {t('excursionDetails.personnes')}: ({excursion.prices.sevenToEight} DT)
                      </p>
                      <Label htmlFor="numberOfAdults">{t('excursions.numberOfAdults')} *</Label>
                      <Input
                        id="numberOfAdults"
                        type="number"
                        min="0"
                        max={maxAdults}
                        value={formData.numberOfAdults}
                        onChange={(e) => setFormData(prev => ({ ...prev, numberOfAdults: parseInt(e.target.value) || 0 }))}
                        className="text-sm sm:text-md"
                      />
                    </div>

                    <div>
                      <Label htmlFor="numberOfChildren">{t('excursions.numberOfChildren')} *</Label>
                      <Input
                        id="numberOfChildren"
                        type="number"
                        min="0"
                        max={maxChildren}
                        value={formData.numberOfChildren}
                        onChange={(e) => setFormData(prev => ({ ...prev, numberOfChildren: parseInt(e.target.value) || 0 }))}
                        className="text-sm sm:text-md"
                      />
                    </div>

                    <div>
                      <Label htmlFor="numberOfBabies">{t('excursions.numberOfBabies')} *</Label>
                      <Input
                        id="numberOfBabies"
                        type="number"
                        min="0"
                        max={maxBabies}
                        value={formData.numberOfBabies}
                        onChange={(e) => setFormData(prev => ({ ...prev, numberOfBabies: parseInt(e.target.value) || 0 }))}
                        className="text-sm sm:text-md"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Max 8 {t('excursionDetails.maxPersons')}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="withGuide"
                        checked={formData.withGuide}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, withGuide: checked as boolean, driverLanguages: checked ? prev.driverLanguages : '' }))}
                      />
                      <Label htmlFor="withGuide">{t('excursionDetails.withGuide')} (+200 DT)</Label>
                    </div>

                    {formData.withGuide && (
                      <div>
                        <Label htmlFor="driverLanguages">{t('excursionDetails.driverLanguages')} *</Label>
                        <Textarea
                          id="driverLanguages"
                          value={formData.driverLanguages}
                          onChange={(e) => setFormData(prev => ({ ...prev, driverLanguages: e.target.value }))}
                          placeholder={t('excursionDetails.inputDriverLanguages')}
                          className="text-sm sm:text-md"
                          rows={3}
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="message">{t('forms.message')}</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder={t('contact.inputMessage')}
                        className="text-sm sm:text-md"
                        rows={3}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>{t('excursionDetails.total')}:</span>
                        <span className="text-primary">
                          {totalPrice} DT
                        </span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        handleSubmit();
                        window.scrollTo(0, 0);
                      }}
                      size="lg"
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Envoi...' : t('excursions.reserve')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ExcursionDetails;