import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Car, Calendar, Clock, Users, Phone, Mail, Languages, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateTransferMutation, useGetAllVehiclesQuery } from '@/globalRedux/features/api/apiSlice';
import distances from '@/data/distances.json' assert { type: "json" };
import { CreateTransferRequest, ITransferResponse } from '@/types/types';

interface AddTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transfer: Omit<CreateTransferRequest, 'price'>) => void;
}

const AddTransferModal = ({ open, onOpenChange, onSave }: AddTransferModalProps) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [tripType, setTripType] = useState<'aller simple' | 'aller retour'>('aller simple');
  const [departureLocation, setDepartureLocation] = useState('');
  const [departureAddress, setDepartureAddress] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [numberOfAdults, setNumberOfAdults] = useState(1);
  const [numberOfChildren, setNumberOfChildren] = useState(0);
  const [isLanguageActive, setIsLanguageActive] = useState(false);
  const [driverLanguage, setDriverLanguage] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'completed' | 'rejected'>('pending');
  const [paymentPercentage, setPaymentPercentage] = useState<0 | 100>(0);
  const [filteredDestinations, setFilteredDestinations] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [createTransfer, { isLoading }] = useCreateTransferMutation();
  const { data: vehiclesData, isLoading: vehiclesLoading } = useGetAllVehiclesQuery({ page, limit: 10, search: '' });

  const locations = [...new Set(distances.map(d => d.from).concat(distances.map(d => d.to)))];

  const availableLanguages = ['Français', 'Anglais', 'Arabe', 'Allemand', 'Italien'];

  useEffect(() => {
    if (departureLocation) {
      const validDestinations = locations.filter(dest => {
        if (dest === departureLocation) return false;
        const distance = distances.find(
          d => (d.from === departureLocation && d.to === dest) || (d.from === dest && d.to === departureLocation)
        )?.distance_km || 0;
        return distance >= 50;
      });
      setFilteredDestinations(validDestinations);
    } else {
      setFilteredDestinations(locations);
    }
  }, [departureLocation]);

  useEffect(() => {
    if (status !== 'confirmed') {
      setPaymentPercentage(0);
    }
  }, [status]);

  const handleLanguageChange = (language: string, checked: boolean) => {
    setDriverLanguage(prev => 
      checked ? [...prev, language] : prev.filter(lang => lang !== language)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const transferData: Omit<CreateTransferRequest, 'price'> = {
      clientName,
      clientEmail,
      clientPhone,
      tripType,
      departureLocation,
      departureAddress: departureAddress || undefined,
      destination,
      destinationAddress: destinationAddress || undefined,
      travelDate,
      departureTime,
      flightNumber: flightNumber || undefined,
      numberOfAdults,
      numberOfChildren,
      driverLanguage: isLanguageActive ? driverLanguage : [],
      comment: comment || undefined,
      vehicleId,
      status,
      paymentPercentage: status === 'confirmed' ? paymentPercentage : 0,
    };

    console.log('AddTransferModal - Sending transfer data:', transferData); // Debug request data

    try {
      const response = await createTransfer(transferData).unwrap();
      const transformedData: Omit<CreateTransferRequest, 'price'> = {
        clientName: response.data.clientName,
        clientEmail: response.data.clientEmail,
        clientPhone: response.data.clientPhone,
        tripType: response.data.tripType,
        departureLocation: response.data.departureLocation,
        departureAddress: response.data.departureAddress,
        destination: response.data.destination,
        destinationAddress: response.data.destinationAddress,
        travelDate: response.data.travelDate,
        departureTime: response.data.departureTime,
        flightNumber: response.data.flightNumber,
        numberOfAdults: response.data.numberOfAdults,
        numberOfChildren: response.data.numberOfChildren,
        driverLanguage: response.data.driverLanguage,
        comment: response.data.comment,
        vehicleId: response.data.vehicleId._id,
        status: response.data.status,
        paymentPercentage: response.data.paymentPercentage,
      };
      console.log('AddTransferModal - Response data:', response.data); // Debug response
      onSave(transformedData);
      onOpenChange(false);
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setTripType('aller simple');
      setDepartureLocation('');
      setDepartureAddress('');
      setDestination('');
      setDestinationAddress('');
      setTravelDate('');
      setDepartureTime('');
      setFlightNumber('');
      setNumberOfAdults(1);
      setNumberOfChildren(0);
      setIsLanguageActive(false);
      setDriverLanguage([]);
      setComment('');
      setVehicleId('');
      setStatus('pending');
      setPaymentPercentage(0);
      setErrorMessage(null);
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Échec de la création du transfert';
      setErrorMessage(message);
      console.error('AddTransferModal - Error:', error);
    }
  };

  const getPrice = (vehicle: { pricePerKm: number }) => {
    const distance = distances.find(
      d => (d.from === departureLocation && d.to === destination) || 
           (d.from === destination && d.to === departureLocation)
    )?.distance_km || 0;
    const multiplier = tripType === 'aller retour' ? 2 : 1;
    const basePrice = distance * vehicle.pricePerKm * multiplier;
    const languageFee = isLanguageActive && driverLanguage.length > 0 ? 30 : 0;
    return (basePrice + languageFee).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-admin-bg text-admin-foreground max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un Nouveau Transfert</DialogTitle>
        </DialogHeader>
        {errorMessage && (
          <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Nom du Client</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="bg-admin-card border-admin-border"
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-muted" />
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  className="pl-10 bg-admin-card border-admin-border"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="clientPhone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-muted" />
                <Input
                  id="clientPhone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                  className="pl-10 bg-admin-card border-admin-border"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tripType">Type de Voyage</Label>
              <Select value={tripType} onValueChange={(value: 'aller simple' | 'aller retour') => setTripType(value)}>
                <SelectTrigger className="bg-admin-card border-admin-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aller simple">Aller Simple</SelectItem>
                  <SelectItem value="aller retour">Aller Retour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="departureLocation">Lieu de Départ</Label>
              <Select value={departureLocation} onValueChange={setDepartureLocation}>
                <SelectTrigger className="bg-admin-card border-admin-border">
                  <SelectValue placeholder="Sélectionner un lieu" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="departureAddress">Adresse de Départ (optionnel)</Label>
              <Input
                id="departureAddress"
                value={departureAddress}
                onChange={(e) => setDepartureAddress(e.target.value)}
                className="bg-admin-card border-admin-border"
              />
            </div>
            <div>
              <Label htmlFor="destination">Destination</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="bg-admin-card border-admin-border">
                  <SelectValue placeholder="Sélectionner une destination" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDestinations.map((dest) => (
                    <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="destinationAddress">Adresse de Destination (optionnel)</Label>
              <Input
                id="destinationAddress"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="bg-admin-card border-admin-border"
              />
            </div>
            <div>
              <Label htmlFor="travelDate">Date de Voyage</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-muted" />
                <Input
                  id="travelDate"
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  required
                  className="pl-10 bg-admin-card border-admin-border"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="departureTime">Heure de Départ</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-muted" />
                <Input
                  id="departureTime"
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                  className="pl-10 bg-admin-card border-admin-border"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="flightNumber">Numéro de Vol (optionnel)</Label>
              <Input
                id="flightNumber"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="bg-admin-card border-admin-border"
              />
            </div>
            <div>
              <Label htmlFor="numberOfAdults">Nombre d'Adultes</Label>
              <Input
                id="numberOfAdults"
                type="number"
                min="1"
                value={numberOfAdults}
                onChange={(e) => setNumberOfAdults(parseInt(e.target.value))}
                required
                className="bg-admin-card border-admin-border"
              />
            </div>
            <div>
              <Label htmlFor="numberOfChildren">Nombre d'Enfants</Label>
              <Input
                id="numberOfChildren"
                type="number"
                min="0"
                value={numberOfChildren}
                onChange={(e) => setNumberOfChildren(parseInt(e.target.value))}
                className="bg-admin-card border-admin-border"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="languageToggle"
                  checked={isLanguageActive}
                  onCheckedChange={(checked) => {
                    setIsLanguageActive(!!checked);
                    if (!checked) setDriverLanguage([]);
                  }}
                />
                <Label htmlFor="languageToggle">Activer Langues du Chauffeur</Label>
              </div>
              {isLanguageActive && (
                <div className="mt-2 space-y-2">
                  <Label>Langues du Chauffeur (optionnel)</Label>
                  {availableLanguages.map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={`language-${language}`}
                        checked={driverLanguage.includes(language)}
                        onCheckedChange={(checked) => handleLanguageChange(language, !!checked)}
                      />
                      <Label htmlFor={`language-${language}`}>{language}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={status} onValueChange={(value: 'pending' | 'confirmed' | 'completed' | 'rejected') => setStatus(value)}>
                <SelectTrigger className="bg-admin-card border-admin-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {status === 'confirmed' && (
              <div>
                <Label htmlFor="paymentPercentage">Pourcentage de Paiement</Label>
                <Select value={paymentPercentage.toString()} onValueChange={(value) => setPaymentPercentage(parseInt(value) as 0 | 100)}>
                  <SelectTrigger className="bg-admin-card border-admin-border">
                    <SelectValue placeholder="Sélectionner un pourcentage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="comment">Commentaire (optionnel)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-admin-muted" />
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full pl-10 bg-admin-card border-admin-border text-admin-foreground rounded-md p-2"
                rows={4}
              />
            </div>
          </div>
          {departureLocation && destination && (
            <div>
              <Label>Véhicules Disponibles</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {vehiclesLoading ? (
                  <div>Chargement des véhicules...</div>
                ) : (
                  vehiclesData?.data?.filter(v => v.isAvailable).map((vehicle) => (
                    <div
                      key={vehicle._id}
                      className={`p-4 border rounded-md cursor-pointer ${
                        vehicleId === vehicle._id ? 'border-admin-foreground bg-admin-bg/50' : 'border-admin-border'
                      }`}
                      onClick={() => setVehicleId(vehicle._id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Car className="h-5 w-5 text-admin-foreground" />
                        <div>
                          <div className="font-medium">{vehicle.name}</div>
                          <div className="text-sm text-gray-100">
                            {vehicle.numberOfSeats} sièges, {vehicle.numberOfSuitcases} valises
                          </div>
                          <div className="text-sm font-bold text-admin-foreground">
                            Prix: {getPrice(vehicle)} TND
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(1)}
                  className="border-admin-border text-gray-900"
                >
                  Page 1
                </Button>
                <Button
                  variant="outline"
                  disabled={page === 2 || vehiclesData?.totalPages === 1}
                  onClick={() => setPage(2)}
                  className="border-admin-border text-gray-900"
                >
                  Page 2
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-admin-border text-gray-900"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !vehicleId || (status === 'confirmed' && paymentPercentage === undefined)}
              className="bg-admin-foreground text-gray-900 hover:bg-gray-300"
            >
              {isLoading ? 'Création...' : 'Créer Transfert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransferModal;