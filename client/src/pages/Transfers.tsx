import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Car, Users, Check, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import transferVehicle from '@/assets/transfer-vehicle.jpg';

interface Vehicle {
  id: string;
  name: string;
  seats: number;
  image: string;
  available: boolean;
}

const Transfers = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [formData, setFormData] = useState({
    tripType: '',
    departure: '',
    destination: '',
    fullName: '',
    email: '',
    phone: '',
    travelDate: '',
    travelTime: '',
    flightNumber: '',
    adults: 1,
    childSeats: 0,
    driverLanguages: [] as string[],
    comment: ''
  });

  // Mock vehicles data
  const vehicles: Vehicle[] = [
    { id: '1', name: 'Sedan Confort', seats: 4, image: transferVehicle, available: true },
    { id: '2', name: 'SUV Premium', seats: 7, image: transferVehicle, available: true },
    { id: '3', name: 'Minibus', seats: 16, image: transferVehicle, available: true },
    { id: '4', name: 'Bus Grand Confort', seats: 50, image: transferVehicle, available: false },
  ];

  const languages = [
    { id: 'arabic', label: 'Arabe' },
    { id: 'french', label: 'Français' },
    { id: 'english', label: 'Anglais' },
    { id: 'german', label: 'Allemand' },
    { id: 'italian', label: 'Italien' },
  ];

  const handleLanguageChange = (languageId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      driverLanguages: checked 
        ? [...prev.driverLanguages, languageId]
        : prev.driverLanguages.filter(lang => lang !== languageId)
    }));
  };

  const handleSubmit = () => {
    if (!selectedVehicle || !formData.fullName || !formData.email || !formData.phone) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Mock form submission
    console.log('Transfer booking:', { vehicle: selectedVehicle, ...formData });
    
    toast({
      title: "Succès",
      description: t('transfers.confirmationMessage'),
    });

    // Reset form
    setSelectedVehicle('');
    setFormData({
      tripType: '',
      departure: '',
      destination: '',
      fullName: '',
      email: '',
      phone: '',
      travelDate: '',
      travelTime: '',
      flightNumber: '',
      adults: 1,
      childSeats: 0,
      driverLanguages: [],
      comment: ''
    });
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('transfers.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Réservez votre transfert en toute simplicité
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vehicle Selection */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <Card className="card-elegant">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Car className="mr-3 h-6 w-6 text-primary" />
                  {t('transfers.vehicleSelection')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-300 ${
                        selectedVehicle === vehicle.id
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-border hover:border-primary/50'
                      } ${!vehicle.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => vehicle.available && setSelectedVehicle(vehicle.id)}
                    >
                      <img
                        src={vehicle.image}
                        alt={vehicle.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                      <h3 className="font-semibold text-foreground mb-1">{vehicle.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <Users className="h-4 w-4 mr-1" />
                        {vehicle.seats} places
                      </div>
                      {selectedVehicle === vehicle.id && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      {!vehicle.available && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                          <span className="text-white font-semibold">Indisponible</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-3"
          >
            <Card className="card-elegant">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Détails de la Réservation</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Trip Type */}
                  <div>
                    <Label htmlFor="tripType">{t('transfers.tripType')} *</Label>
                    <Select value={formData.tripType} onValueChange={(value) => setFormData(prev => ({ ...prev, tripType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-way">{t('transfers.oneWay')}</SelectItem>
                        <SelectItem value="round-trip">{t('transfers.roundTrip')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Departure */}
                  <div>
                    <Label htmlFor="departure">{t('transfers.departure')} *</Label>
                    <Input
                      id="departure"
                      value={formData.departure}
                      onChange={(e) => setFormData(prev => ({ ...prev, departure: e.target.value }))}
                      placeholder="Ex: Aéroport Tunis-Carthage"
                    />
                  </div>

                  {/* Destination */}
                  <div>
                    <Label htmlFor="destination">{t('transfers.destination')} *</Label>
                    <Input
                      id="destination"
                      value={formData.destination}
                      onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                      placeholder="Ex: Hôtel, Adresse..."
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <Label htmlFor="fullName">{t('forms.fullName')} *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Votre nom complet"
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
                      placeholder="votre@email.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone">{t('forms.phone')} *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+216 12 345 678"
                    />
                  </div>

                  {/* Travel Date */}
                  <div>
                    <Label htmlFor="travelDate" className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {t('transfers.travelDate')} *
                    </Label>
                    <Input
                      id="travelDate"
                      type="date"
                      value={formData.travelDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, travelDate: e.target.value }))}
                    />
                  </div>

                  {/* Travel Time */}
                  <div>
                    <Label htmlFor="travelTime" className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {t('transfers.travelTime')} *
                    </Label>
                    <Input
                      id="travelTime"
                      type="time"
                      value={formData.travelTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, travelTime: e.target.value }))}
                    />
                  </div>

                  {/* Flight Number */}
                  <div>
                    <Label htmlFor="flightNumber">{t('transfers.flightNumber')}</Label>
                    <Input
                      id="flightNumber"
                      value={formData.flightNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, flightNumber: e.target.value }))}
                      placeholder="Ex: TU 123"
                    />
                  </div>

                  {/* Adults */}
                  <div>
                    <Label htmlFor="adults">{t('transfers.adults')}</Label>
                    <Input
                      id="adults"
                      type="number"
                      min="1"
                      value={formData.adults}
                      onChange={(e) => setFormData(prev => ({ ...prev, adults: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  {/* Child Seats */}
                  <div>
                    <Label htmlFor="childSeats">{t('transfers.childSeats')}</Label>
                    <Input
                      id="childSeats"
                      type="number"
                      min="0"
                      value={formData.childSeats}
                      onChange={(e) => setFormData(prev => ({ ...prev, childSeats: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                {/* Driver Languages */}
                <div className="mt-6">
                  <Label className="text-base font-semibold mb-4 block">{t('transfers.driverLanguage')}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {languages.map((language) => (
                      <div key={language.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={language.id}
                          checked={formData.driverLanguages.includes(language.id)}
                          onCheckedChange={(checked) => handleLanguageChange(language.id, !!checked)}
                        />
                        <Label htmlFor={language.id}>{language.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="mt-6">
                  <Label htmlFor="comment">{t('transfers.comment')}</Label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Informations supplémentaires..."
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <div className="mt-8">
                  <Button 
                    onClick={handleSubmit}
                    size="lg"
                    className="w-full btn-hero"
                  >
                    {t('transfers.confirmationMessage').includes('succès') ? t('forms.submit') : t('forms.bookNow')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Transfers;