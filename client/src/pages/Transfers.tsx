import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Car, Users, Check, Calendar, Clock, MapPin, Mail, Phone, FileText, Briefcase, Languages, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useCreateTransferMutation, useGetAllVehiclesQuery } from '@/globalRedux/features/api/apiSlice';
import distances from '@/data/distances.json';
import { CreateTransferRequest, IVehicleResponse } from '@/types/types';
import SeoConfig from '@/seo/SeoConfig';

// Utility function to format date to YYYY-MM-DD
const formatDateForInput = (): string => {
  return new Date().toISOString().split('T')[0];
};

const Transfers = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const [transferData, setTransferData] = useState<CreateTransferRequest>({
    tripType: 'aller simple',
    departureLocation: '',
    departureAddress: '',
    destination: '',
    destinationAddress: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    travelDate: formatDateForInput(),
    departureTime: '',
    flightNumber: '',
    numberOfAdults: 1,
    numberOfChildren: 0,
    numberOfSuitcases: 0,
    driverLanguage: [],
    comment: '',
    vehicleId: '',
  });
  const [filteredDestinations, setFilteredDestinations] = useState<string[]>([]);
  const [isLanguageActive, setIsLanguageActive] = useState(false);

  const [createTransfer, { isLoading }] = useCreateTransferMutation();
  const { data: vehiclesData, isLoading: vehiclesLoading } = useGetAllVehiclesQuery({ page: currentPage, limit: 10, search: '' });

  const locations = [...new Set(distances.map(d => d.from).concat(distances.map(d => d.to)))];

  const availableLanguages = [
    { id: 'french', label: t('transfers.languages.french', { defaultValue: 'Français' }) },
    { id: 'english', label: t('transfers.languages.english', { defaultValue: 'Anglais' }) },
    { id: 'arabic', label: t('transfers.languages.arabic', { defaultValue: 'Arabe' }) },
    { id: 'german', label: t('transfers.languages.german', { defaultValue: 'Allemand' }) },
    { id: 'italian', label: t('transfers.languages.italian', { defaultValue: 'Italien' }) },
  ];

  useEffect(() => {
    if (transferData.departureLocation) {
      const validDestinations = locations.filter(dest => {
        if (dest === transferData.departureLocation) return false;
        const distance = distances.find(
          d => (d.from === transferData.departureLocation && d.to === dest) || (d.from === dest && d.to === transferData.departureLocation)
        )?.distance_km || 0;
        return distance >= 50;
      });
      setFilteredDestinations(validDestinations);
    } else {
      setFilteredDestinations(locations);
    }
  }, [transferData.departureLocation]);

  const handleLanguageChange = (languageId: string, checked: boolean) => {
    setTransferData(prev => ({
      ...prev,
      driverLanguage: checked 
        ? [...(prev.driverLanguage || []), languageId]
        : (prev.driverLanguage || []).filter(lang => lang !== languageId)
    }));
  };

  const getPrice = (vehicle: { pricePerKm: number }) => {
    const distance = distances.find(
      d => (d.from === transferData.departureLocation && d.to === transferData.destination) || 
           (d.from === transferData.destination && d.to === transferData.departureLocation)
    )?.distance_km || 0;
    const multiplier = transferData.tripType === 'aller retour' ? 2 : 1;
    const basePrice = distance * vehicle.pricePerKm * multiplier;
    const languageFee = isLanguageActive && (transferData.driverLanguage?.length || 0) > 0 ? 30 : 0;
    return (basePrice + languageFee).toFixed(2);
  };

  const handleNextStep = () => {
    if (step === 1 && (!transferData.departureLocation.trim() || !transferData.destination.trim())) {
      toast({
        title: t('transfers.error', { defaultValue: 'Erreur' }),
        description: t('transfers.errorLocations', { defaultValue: 'Veuillez sélectionner le lieu de départ et la destination' }),
        variant: 'destructive',
      });
      return;
    }
    if (step === 2 && !selectedVehicle) {
      toast({
        title: t('transfers.error', { defaultValue: 'Erreur' }),
        description: t('transfers.errorVehicle', { defaultValue: 'Veuillez sélectionner un véhicule' }),
        variant: 'destructive',
      });
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const selectedVehicleData = vehiclesData?.data?.find(v => v._id === selectedVehicle);
  const availableSeats = selectedVehicleData ? selectedVehicleData.numberOfSeats - 2 : 0;
  const maxSuitcases = selectedVehicleData ? selectedVehicleData.numberOfSuitcases : 0;

  const maxAdults = selectedVehicleData ? Math.max(1, availableSeats - (transferData.numberOfChildren || 0)) : 1;
  const maxChildren = selectedVehicleData ? Math.max(0, availableSeats - transferData.numberOfAdults) : 0;

  const handleAdultsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    const cappedValue = Math.min(value, maxAdults);
    setTransferData(prev => ({ ...prev, numberOfAdults: cappedValue }));
  };

  const handleChildrenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const cappedValue = Math.min(value, maxChildren);
    setTransferData(prev => ({ ...prev, numberOfChildren: cappedValue }));
  };

  const handleSuitcasesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const cappedValue = Math.min(value, maxSuitcases);
    setTransferData(prev => ({ ...prev, numberOfSuitcases: cappedValue }));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= Math.min(vehiclesData?.totalPages || 1, 2)) {
      setCurrentPage(page);
      setPageInput('');
      window.scrollTo(0, 0);
    }
  };

  const handlePageInputSubmit = () => {
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= Math.min(vehiclesData?.totalPages || 1, 2)) {
      setCurrentPage(pageNum);
      setPageInput('');
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    const missingFields: string[] = [];
    if (!selectedVehicle) missingFields.push(t('transfers.vehicleSelection', { defaultValue: 'Véhicule' }));
    if (!transferData.clientName.trim()) missingFields.push(t('forms.fullName', { defaultValue: 'Nom Complet' }));
    if (!transferData.clientEmail.trim()) missingFields.push(t('forms.email', { defaultValue: 'Email' }));
    if (!transferData.clientPhone.trim()) missingFields.push(t('forms.phone', { defaultValue: 'Téléphone' }));
    if (!transferData.tripType) missingFields.push(t('transfers.tripType', { defaultValue: 'Type de Voyage' }));
    if (!transferData.departureLocation.trim()) missingFields.push(t('transfers.departure', { defaultValue: 'Lieu de Départ' }));
    if (!transferData.destination.trim()) missingFields.push(t('transfers.destination', { defaultValue: 'Destination' }));
    if (!transferData.travelDate) missingFields.push(t('transfers.travelDate', { defaultValue: 'Date de Voyage' }));
    if (!transferData.departureTime) missingFields.push(t('transfers.travelTime', { defaultValue: 'Heure de Départ' }));

    if (missingFields.length > 0) {
      toast({
        title: t('transfers.error', { defaultValue: 'Erreur' }),
        description: t('transfers.errorMessageSpecific', {
          defaultValue: 'Veuillez remplir les champs obligatoires suivants : {{fields}}',
          fields: missingFields.join(', ')
        }),
        variant: 'destructive',
      });
      return;
    }

    if (selectedVehicleData && (transferData.numberOfAdults + (transferData.numberOfChildren || 0)) > availableSeats) {
      toast({
        title: t('transfers.error', { defaultValue: 'Erreur' }),
        description: t('transfers.errorSeats', { defaultValue: 'Le nombre total de passagers dépasse les places disponibles' }),
        variant: 'destructive',
      });
      return;
    }
    if (selectedVehicleData && transferData.numberOfSuitcases > maxSuitcases) {
      toast({
        title: t('transfers.error', { defaultValue: 'Erreur' }),
        description: t('transfers.errorSuitcases', { defaultValue: 'Le nombre de valises dépasse la capacité du véhicule' }),
        variant: 'destructive',
      });
      return;
    }

    const transferPayload: CreateTransferRequest = {
      clientName: transferData.clientName.trim(),
      clientEmail: transferData.clientEmail.trim(),
      clientPhone: transferData.clientPhone.trim(),
      tripType: transferData.tripType,
      departureLocation: transferData.departureLocation.trim(),
      departureAddress: transferData.departureAddress?.trim() || '',
      destination: transferData.destination.trim(),
      destinationAddress: transferData.destinationAddress?.trim() || '',
      travelDate: transferData.travelDate,
      departureTime: transferData.departureTime,
      flightNumber: transferData.flightNumber?.trim() || undefined,
      numberOfAdults: transferData.numberOfAdults,
      numberOfChildren: transferData.numberOfChildren || 0,
      numberOfSuitcases: transferData.numberOfSuitcases || 0,
      driverLanguage: isLanguageActive ? (transferData.driverLanguage || []) : [],
      comment: transferData.comment?.trim() || undefined,
      vehicleId: selectedVehicle,
    };

    try {
      await createTransfer(transferPayload).unwrap();
      setIsSuccess(true);
      toast({
        title: t('transfers.success', { defaultValue: 'Succès' }),
        description: t('transfers.confirmationMessage', { defaultValue: 'Votre réservation a été enregistrée avec succès' }),
      });
    } catch (error: any) {
      const message = error?.data?.message || error?.message || t('transfers.errorMessage', { defaultValue: 'Échec de la création du transfert' });
      toast({
        title: t('transfers.error', { defaultValue: 'Erreur' }),
        description: message,
        variant: 'destructive',
      });
      console.error('Échec de la création du transfert:', error);
    }
  };

  const selectedVehiclePrice = selectedVehicle && vehiclesData?.data?.find(v => v._id === selectedVehicle)
    ? getPrice(vehiclesData.data.find(v => v._id === selectedVehicle)!)
    : '0.00';

  const totalPages = Math.min(vehiclesData?.totalPages || 1, 2);

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
              <Link to="/">
                <Button
                  variant="outline"
                  className="flex items-center mx-auto"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('excursionDetails.backToHome', { defaultValue: 'Retour à l\'accueil' })}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SeoConfig
        title="Navettes Aéroport et Transferts Privés - Navette Tunisie"
        description="Profitez de transferts aéroport et privés en Tunisie avec Navette Tunisie. Service rapide, fiable et confortable à des prix compétitifs."
        keywords="navette aéroport Tunis, transferts privés Tunisie, Navette Tunisie, transport Tunisie, location véhicule Tunisie"
        url="/transfers"
      />
      <div className="min-h-screen py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-1 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-4">
              {t('transfers.title', { defaultValue: 'Réservez Votre Transfert' })}
            </h1>
            <p className="text-md sm:text-xl text-gray-600 max-w-2xl mx-auto">
              {t('transfers.description', { defaultValue: 'Voyagez confortablement avec nos services de transfert fiables et personnalisés.' })}
            </p>
          </motion.div>

          <Card className="bg-white shadow-lg border border-gray-200 rounded-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3].map((stepNumber) => (
                    <div key={stepNumber} className="flex items-center">
                      <motion.div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                          step >= stepNumber
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                        initial={{ scale: 0.8, opacity: 0.7 }}
                        animate={{
                          scale: step === stepNumber ? 1.1 : 1,
                          opacity: step >= stepNumber ? 1 : 0.7,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {stepNumber}
                      </motion.div>
                      {stepNumber < 3 && (
                        <div
                          className={`h-1 w-16 ${
                            step > stepNumber ? 'bg-orange-600' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t('transfers.selectLocations', { defaultValue: 'Sélectionnez les Lieux' })}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className='flex flex-col gap-2'>
                        <Label htmlFor="tripType" className="flex items-center text-gray-700 font-semibold">
                          <Car className="h-4 w-4 mr-2 text-orange-600" />
                          {t('transfers.tripType', { defaultValue: 'Type de Voyage' })} *
                        </Label>
                        <Select 
                          value={transferData.tripType} 
                          onValueChange={(value: 'aller simple' | 'aller retour') => 
                            setTransferData(prev => ({ ...prev, tripType: value }))
                          }
                        >
                          <SelectTrigger className="bg-white border-gray-300 focus:ring-2 focus:ring-orange-500">
                            <SelectValue placeholder={t('transfers.select', { defaultValue: 'Sélectionnez...' })} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aller simple">{t('transfers.oneWay', { defaultValue: 'Aller Simple' })}</SelectItem>
                            <SelectItem value="aller retour">{t('transfers.roundTrip', { defaultValue: 'Aller Retour' })}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div></div>
                      <div className='flex flex-col gap-2'>
                        <Label htmlFor="departureLocation" className="flex items-center text-gray-700 font-semibold">
                          <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                          {t('transfers.departure', { defaultValue: 'Lieu de Départ' })} *
                        </Label>
                        <Select 
                          value={transferData.departureLocation} 
                          onValueChange={(value) => setTransferData(prev => ({ ...prev, departureLocation: value }))}
                        >
                          <SelectTrigger className="bg-white border-gray-300 focus:ring-2 focus:ring-orange-500">
                            <SelectValue placeholder={t('transfers.departurePlaceholder', { defaultValue: 'Sélectionner un lieu' })} />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location} value={location}>{location}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='flex flex-col gap-2'>
                        <Label htmlFor="departureAddress" className="flex items-center text-gray-700 font-semibold">
                          <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                          {t('transfers.departureAddress', { defaultValue: 'Adresse de Départ (optionnel)' })}
                        </Label>
                        <Input
                          id="departureAddress"
                          value={transferData.departureAddress}
                          onChange={(e) => setTransferData(prev => ({ ...prev, departureAddress: e.target.value }))}
                          placeholder={t('transfers.departureAddressPlaceholder', { defaultValue: 'Entrez l\'adresse de départ' })}
                          className="bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className='flex flex-col gap-2'>
                        <Label htmlFor="destination" className="flex items-center text-gray-700 font-semibold">
                          <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                          {t('transfers.destination', { defaultValue: 'Destination' })} *
                        </Label>
                        <Select 
                          value={transferData.destination} 
                          onValueChange={(value) => setTransferData(prev => ({ ...prev, destination: value }))}
                        >
                          <SelectTrigger className="bg-white border-gray-300 focus:ring-2 focus:ring-orange-500">
                            <SelectValue placeholder={t('transfers.destinationPlaceholder', { defaultValue: 'Sélectionner une destination' })} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredDestinations.map((dest) => (
                              <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='flex flex-col gap-2'>
                        <Label htmlFor="destinationAddress" className="flex items-center text-gray-700 font-semibold">
                          <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                          {t('transfers.destinationAddress', { defaultValue: 'Adresse de Destination (optionnel)' })}
                        </Label>
                        <Input
                          id="destinationAddress"
                          value={transferData.destinationAddress}
                          onChange={(e) => setTransferData(prev => ({ ...prev, destinationAddress: e.target.value }))}
                          placeholder={t('transfers.destinationAddressPlaceholder', { defaultValue: 'Entrez l\'adresse de destination' })}
                          className="bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={() => {
                          handleNextStep();
                          window.scrollTo(0, 0);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                      >
                        {t('transfers.next', { defaultValue: 'Suivant' })}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && transferData.departureLocation && transferData.destination && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t('transfers.vehicleSelection', { defaultValue: 'Choisissez Votre Véhicule' })}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {vehiclesLoading ? (
                        <div>{t('transfers.loadingVehicles', { defaultValue: 'Chargement des véhicules...' })}</div>
                      ) : (
                        vehiclesData?.data?.filter((v: IVehicleResponse) => v.isAvailable).map((vehicle: IVehicleResponse) => (
                          <div
                            key={vehicle._id}
                            className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-300 ${
                              selectedVehicle === vehicle._id
                                ? 'border-orange-600 bg-orange-50 shadow-lg'
                                : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/50'
                            }`}
                            onClick={() => {
                              setSelectedVehicle(vehicle._id);
                              setTransferData(prev => ({
                                ...prev,
                                vehicleId: vehicle._id,
                                numberOfAdults: 1,
                                numberOfChildren: 0,
                                numberOfSuitcases: 0
                              }));
                            }}
                          >
                            <img
                              src={`${import.meta.env.VITE_API_IMG}${vehicle.imgUrl}`}
                              alt={vehicle.name}
                              className="w-full h-24 sm:h-32 object-cover rounded-md mb-3"
                            />
                            <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1">{vehicle.name}</h3>
                            <div className="text-xs sm:text-sm text-gray-600 mb-1 flex items-center">
                              <Users className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                              {vehicle.numberOfSeats} {t('transfers.seats', { defaultValue: 'sièges' })}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mb-2 flex items-center">
                              <Briefcase className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                              {vehicle.numberOfSuitcases} {t('transfers.suitcases', { defaultValue: 'valises' })}
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-gray-900">
                              {t('transfers.price', { defaultValue: 'Prix' })}: {getPrice(vehicle)} TND
                            </div>
                            {selectedVehicle === vehicle._id && (
                              <div className="absolute top-2 right-2 bg-orange-600 text-white rounded-full p-1">
                                <Check className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-6 flex justify-center md:justify-between items-center">
                      <Button
                        onClick={() => {
                          handlePrevStep();
                          window.scrollTo(0, 0);
                        }}
                        variant="outline"
                        className="border-gray-300 text-gray-900 hover:bg-gray-100 hidden md:block"
                      >
                        {t('transfers.previous', { defaultValue: 'Précédent' })}
                      </Button>
                      <div className="flex items-center md:space-x-2">
                        <Button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="bg-white text-gray-900 hover:bg-gray-100 border-gray-300
                                text-xs md:text-sm"
                        >
                          {t('transfers.previous', { defaultValue: 'Précédent' })}
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={currentPage === page ? 'bg-orange-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-100 border-gray-300'}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="text-xs md:text-sm bg-white text-gray-900 hover:bg-gray-100 border-gray-300"
                        >
                          {t('transfers.next', { defaultValue: 'Suivant' })}
                        </Button>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder={t('transfers.page', { defaultValue: 'Page' })}
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            className="w-20 text-xs bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                          />
                          <Button
                            onClick={handlePageInputSubmit}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            {t('transfers.go', { defaultValue: 'Go' })}
                          </Button>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          handleNextStep();
                          window.scrollTo(0, 0);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold hidden md:block"
                      >
                        {t('transfers.next', { defaultValue: 'Suivant' })}
                      </Button>
                    </div>
                    <div className='flex justify-between pt-7' >
                    <Button
                        onClick={() => {
                          handlePrevStep();
                          window.scrollTo(0, 0);
                        }}
                        variant="outline"
                        className="border-gray-300 text-gray-900 hover:bg-gray-100 md:hidden"
                      >
                        {t('transfers.previous', { defaultValue: 'Précédent' })}
                      </Button>

                    <Button
                        onClick={() => {
                          handleNextStep();
                          window.scrollTo(0, 0);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold md:hidden"
                      >
                        {t('transfers.next', { defaultValue: 'Suivant' })}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t('transfers.bookingDetails', { defaultValue: 'Détails de la Réservation' })}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className='flex flex-col gap-2'>
                        <Label htmlFor="clientName" className="flex items-center text-gray-700 font-semibold">
                          <Users className="h-4 w-4 mr-2 text-orange-600" />
                          {t('forms.fullName', { defaultValue: 'Nom Complet' })} *
                        </Label>
                        <Input
                          id="clientName"
                          value={transferData.clientName}
                          onChange={(e) => setTransferData(prev => ({ ...prev, clientName: e.target.value }))}
                          placeholder={t('forms.fullNamePlaceholder', { defaultValue: 'Votre nom complet' })}
                          className="bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className='flex flex-col gap-2'>
                        <Label htmlFor="clientEmail" className="flex items-center text-gray-700 font-semibold">
                          <Mail className="h-4 w-4 mr-2 text-orange-600" />
                          {t('forms.email', { defaultValue: 'Email' })} *
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="clientEmail"
                            type="email"
                            value={transferData.clientEmail}
                            onChange={(e) => setTransferData(prev => ({ ...prev, clientEmail: e.target.value }))}
                            placeholder={t('forms.emailPlaceholder', { defaultValue: 'votre@email.com' })}
                            className="pl-10 bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                      <div className='flex flex-col gap-2'>
                        <Label htmlFor="clientPhone" className="flex items-center text-gray-700 font-semibold">
                          <Phone className="h-4 w-4 mr-2 text-orange-600" />
                          {t('forms.phone', { defaultValue: 'Téléphone' })} *
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="clientPhone"
                            value={transferData.clientPhone}
                            onChange={(e) => setTransferData(prev => ({ ...prev, clientPhone: e.target.value }))}
                            placeholder={t('forms.phonePlaceholder', { defaultValue: '+216...' })}
                            className="pl-10 bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                      <div className='flex flex-col gap-2'>
                        <Label htmlFor="travelDate" className="flex items-center text-gray-700 font-semibold">
                          <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                          {t('transfers.travelDate', { defaultValue: 'Date de Voyage' })} *
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="travelDate"
                            type="date"
                            value={transferData.travelDate}
                            onChange={(e) => setTransferData(prev => ({ ...prev, travelDate: e.target.value }))}
                            className="pl-10 bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                      <div className='flex flex-col gap-2'>
                        <Label htmlFor="departureTime" className="flex items-center text-gray-700 font-semibold">
                          <Clock className="h-4 w-4 mr-2 text-orange-600" />
                          {t('transfers.travelTime', { defaultValue: 'Heure de Départ' })} *
                        </Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="departureTime"
                            type="time"
                            value={transferData.departureTime}
                            onChange={(e) => setTransferData(prev => ({ ...prev, departureTime: e.target.value }))}
                            className="pl-10 bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                      <div className='flex flex-col gap-2'>
                        <Label htmlFor="flightNumber" className="flex items-center text-gray-700 font-semibold">
                          <FileText className="h-4 w-4 mr-2 text-orange-600" />
                          {t('transfers.flightNumber', { defaultValue: 'Numéro de Vol (optionnel)' })}
                        </Label>
                        <Input
                          id="flightNumber"
                          value={transferData.flightNumber}
                          onChange={(e) => setTransferData(prev => ({ ...prev, flightNumber: e.target.value }))}
                          placeholder={t('transfers.flightNumberPlaceholder', { defaultValue: 'Ex: TU 123' })}
                          className="bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className='flex flex-col gap-2'>
                        <div className="text-sm text-gray-600 mb-2">
                          {selectedVehicleData 
                            ? t('transfers.availableSeats', { 
                                defaultValue: 'Nombre de places disponibles dans ce véhicule: {{available}} (sur {{total}})', 
                                available: availableSeats, 
                                total: selectedVehicleData.numberOfSeats 
                              }) 
                            : t('transfers.noVehicleSelected', { defaultValue: 'Aucun véhicule sélectionné' })}
                        </div>
                        <Label htmlFor="numberOfAdults" className="flex items-center text-gray-700 font-semibold">
                          <Users className="h-4 w-4 mr-2 text-orange-600" />
                          {t('transfers.adults', { defaultValue: 'Nombre d\'Adultes' })}
                        </Label>
                        <Input
                          id="numberOfAdults"
                          type="number"
                          min="1"
                          max={maxAdults}
                          value={transferData.numberOfAdults}
                          onChange={handleAdultsChange}
                          className="bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className='flex flex-col gap-2'>
                        <div className="text-sm text-gray-600 mb-2">
                          {selectedVehicleData 
                            ? t('transfers.availableSeats', { 
                                defaultValue: 'Nombre de places disponibles dans ce véhicule: {{available}} (sur {{total}})', 
                                available: availableSeats, 
                                total: selectedVehicleData.numberOfSeats 
                              }) 
                            : t('transfers.noVehicleSelected', { defaultValue: 'Aucun véhicule sélectionné' })}
                        </div>
                        <Label htmlFor="numberOfChildren" className="flex items-center text-gray-700 font-semibold">
                          <Users className="h-4 w-4 mr-2 text-orange-600" />
                          {t('transfers.numberOfChildren', { defaultValue: 'Nombre d\'Enfants' })}
                        </Label>
                        <Input
                          id="numberOfChildren"
                          type="number"
                          min="0"
                          max={maxChildren}
                          value={transferData.numberOfChildren}
                          onChange={handleChildrenChange}
                          className="bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className='flex flex-col gap-2'>
                        <div className="text-sm text-gray-600 mb-2">
                          {selectedVehicleData 
                            ? t('transfers.maxSuitcases', { 
                                defaultValue: 'Nombre de valises maximum: {{max}}', 
                                max: maxSuitcases 
                              }) 
                            : t('transfers.noVehicleSelected', { defaultValue: 'Aucun véhicule sélectionné' })}
                        </div>
                        <Label htmlFor="numberOfSuitcases" className="flex items-center text-gray-700 font-semibold">
                          <Briefcase className="h-4 w-4 mr-2 text-orange-600" />
                          {t('transfers.numberOfSuitcases', { defaultValue: 'Nombre de Valises' })}
                        </Label>
                        <Input
                          id="numberOfSuitcases"
                          type="number"
                          min="0"
                          max={maxSuitcases}
                          value={transferData.numberOfSuitcases}
                          onChange={handleSuitcasesChange}
                          className="bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-sm text-gray-600 mb-2">
                          {t('transfers.languageFee', { defaultValue: 'Sélectionner des langues ajoute 30 TND au prix total' })}
                        </div>
                        <div className="flex items-center space-x-2 mb-4">
                          <Checkbox
                            id="languageToggle"
                            checked={isLanguageActive}
                            onCheckedChange={(checked) => {
                              setIsLanguageActive(!!checked);
                              if (!checked) setTransferData(prev => ({ ...prev, driverLanguage: [] }));
                            }}
                          />
                          <Label htmlFor="languageToggle" className="text-gray-700 font-semibold">
                            {t('transfers.languageToggle', { defaultValue: 'Activer Langues du Chauffeur' })}
                          </Label>
                        </div>
                        {isLanguageActive && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {availableLanguages.map((language) => (
                              <div key={language.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={language.id}
                                  checked={(transferData.driverLanguage || []).includes(language.id)}
                                  onCheckedChange={(checked) => handleLanguageChange(language.id, !!checked)}
                                />
                                <Label htmlFor={language.id} className="text-gray-700">{language.label}</Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <Label htmlFor="comment" className="flex items-center text-gray-700 font-semibold">
                          <FileText className="h-4 w-4 mr-2 text-orange-600" />
                          {t('transfers.comment', { defaultValue: 'Commentaire (optionnel)' })}
                        </Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Textarea
                            id="comment"
                            value={transferData.comment}
                            onChange={(e) => setTransferData(prev => ({ ...prev, comment: e.target.value }))}
                            placeholder={t('transfers.commentPlaceholder', { defaultValue: 'Informations supplémentaires...' })}
                            rows={3}
                            className="pl-10 bg-white border-gray-300 focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-5 sm:hidden text-lg font-bold text-gray-900">
                      {t('transfers.totalPrice', { defaultValue: 'Prix Total' })}: {selectedVehiclePrice} TND
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                      <Button
                        onClick={() => {
                          handlePrevStep();
                          window.scrollTo(0, 0);
                        }}
                        variant="outline"
                        className="border-gray-300 text-gray-900 hover:bg-gray-100"
                      >
                        {t('transfers.previous', { defaultValue: 'Précédent' })}
                      </Button>
                      <div className="hidden sm:block text-lg font-bold text-gray-900">
                        {t('transfers.totalPrice', { defaultValue: 'Prix Total' })}: {selectedVehiclePrice} TND
                      </div>
                      <Button
                        onClick={() => {
                          handleSubmit();
                          window.scrollTo(0, 0);
                        }}
                        disabled={isLoading}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                      >
                        {isLoading 
                          ? t('transfers.creating', { defaultValue: 'Réservation...' }) 
                          : t('forms.bookNow', { defaultValue: 'Réserver Maintenant' })}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Transfers;