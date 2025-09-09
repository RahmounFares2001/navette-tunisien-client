import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Car, Calendar, Clock, Users, Phone, Mail, Languages, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useUpdateTransferMutation, useGetAllVehiclesQuery } from '@/globalRedux/features/api/apiSlice';
import distances from '@/data/distances.json';
import { UpdateTransferRequest, ITransferResponse } from '@/types/types';

interface UpdateTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: ITransferResponse | null;
  onSave: (transfer: Omit<UpdateTransferRequest, 'price'>) => void;
}

const formatDateForInput = (date: string | Date | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const formatTimeForInput = (time: string | undefined): string => {
  if (!time) return '';
  return time;
};

const UpdateTransferModal = ({ open, onOpenChange, transfer, onSave }: UpdateTransferModalProps) => {
  if (!transfer) return null;

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
  const [currentPrice, setCurrentPrice] = useState<string>('0.00');

  const [updateTransfer, { isLoading }] = useUpdateTransferMutation();
  const { data: vehiclesData, isLoading: vehiclesLoading } = useGetAllVehiclesQuery({ page: 1, limit: 100, search: '' });

  const locations = [...new Set(distances.map(d => d.from).concat(distances.map(d => d.to)))];

  const availableLanguages = ['Français', 'Anglais', 'Arabe', 'Allemand', 'Italien'];

  useEffect(() => {
    if (transfer) {
      setClientName(transfer.clientName || '');
      setClientEmail(transfer.clientEmail || '');
      setClientPhone(transfer.clientPhone || '');
      setTripType(transfer.tripType || 'aller simple');
      setDepartureLocation(transfer.departureLocation || '');
      setDepartureAddress(transfer.departureAddress || '');
      setDestination(transfer.destination || '');
      setDestinationAddress(transfer.destinationAddress || '');
      setTravelDate(formatDateForInput(transfer.travelDate));
      setDepartureTime(formatTimeForInput(transfer.departureTime));
      setFlightNumber(transfer.flightNumber || '');
      setNumberOfAdults(transfer.numberOfAdults || 1);
      setNumberOfChildren(transfer.numberOfChildren || 0);
      setIsLanguageActive(!!(transfer.driverLanguage && transfer.driverLanguage.length > 0));
      setDriverLanguage(transfer.driverLanguage || []);
      setComment(transfer.comment || '');
      setVehicleId(transfer.vehicleId?._id || '');
      setStatus(transfer.status || 'pending');
      setPaymentPercentage(transfer.paymentPercentage === 0 || transfer.paymentPercentage === 100 ? transfer.paymentPercentage : 0);
      
      // Compute initial filteredDestinations, always including the current destination
      const currentDestination = transfer.destination || '';
      const validDestinations = [...new Set([...locations, currentDestination])].filter(dest => dest && dest !== transfer.departureLocation);
      setFilteredDestinations(validDestinations);
    }
  }, [transfer]);

  useEffect(() => {
    if (departureLocation) {
      const validDestinations = locations.filter(dest => {
        if (dest === departureLocation) return false;
        const distance = distances.find(
          d => (d.from === departureLocation && d.to === dest) || (d.from === dest && d.to === departureLocation)
        )?.distance_km || 0;
        return distance >= 50 || dest === destination;
      });
      setFilteredDestinations(validDestinations);
      
      // Ensure destination is valid; reset if not in filteredDestinations
      if (destination && !validDestinations.includes(destination)) {
        setDestination('');
      }
    } else {
      setFilteredDestinations(locations);
    }
  }, [departureLocation, destination]);

  useEffect(() => {
    if (vehicleId && departureLocation && destination) {
      const vehicle = vehiclesData?.data?.find(v => v._id === vehicleId);
      if (vehicle) {
        setCurrentPrice(getPrice(vehicle));
      } else {
        setCurrentPrice('0.00');
      }
    } else {
      setCurrentPrice('0.00');
    }
  }, [vehicleId, departureLocation, destination, tripType, isLanguageActive, driverLanguage, vehiclesData]);

  const handleLanguageChange = (language: string, checked: boolean) => {
    setDriverLanguage(prev =>
      checked ? [...prev, language] : prev.filter(lang => lang !== language)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const transferData: Omit<UpdateTransferRequest, 'price'> = {
      id: transfer._id,
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


    try {
      const response = await updateTransfer(transferData).unwrap();
      const transformedData: Omit<UpdateTransferRequest, 'price'> = {
        id: response.data._id,
        clientName: response.data.clientName,
        clientEmail: response.data.clientEmail,
        clientPhone: response.data.clientPhone,
        tripType: response.data.tripType,
        departureLocation: response.data.departureLocation,
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
      onSave(transformedData);
      onOpenChange(false);
      setErrorMessage(null);
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Échec de la mise à jour du transfert';
      setErrorMessage(message);
      console.error('UpdateTransferModal - Error:', error);
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
          <DialogTitle>Modifier le Transfert</DialogTitle>
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
                  onChange={(e) => setClientName(e.target.value)}
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
              <Select key={transfer._id} value={destination} onValueChange={setDestination}>
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
                onChange={(e) => setNumberOfAdults(parseInt(e.target.value) || 1)}
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
                onChange={(e) => setNumberOfChildren(parseInt(e.target.value) || 0)}
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
                <Select
                  value={paymentPercentage.toString()}
                  onValueChange={(value) => setPaymentPercentage(parseInt(value) as 0 | 100)}
                >
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
          
          <div>
            <Label htmlFor="currentPrice">Prix Actuel</Label>
            <Input
              id="currentPrice"
              value={`${currentPrice} TND`}
              disabled
              className="bg-admin-card border-admin-border text-admin-foreground"
            />
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
                        vehicleId === vehicle._id ?
                           'border-orange-700 bg-orange-700' : 
                            'border-admin-border'
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
              disabled={isLoading || !vehicleId || !destination || (status === 'confirmed' && paymentPercentage === undefined)}
              className="bg-admin-foreground text-gray-900 hover:bg-gray-300"
            >
              {isLoading ? 'Mise à jour...' : 'Mettre à jour le Transfert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateTransferModal;