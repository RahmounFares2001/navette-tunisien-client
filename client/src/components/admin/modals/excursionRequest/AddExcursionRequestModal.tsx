import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useGetAllExcursionsQuery } from '@/globalRedux/features/api/apiSlice';
import { useCreateExcursionRequestMutation } from '@/globalRedux/features/api/apiSlice';
import { toast } from 'react-toastify';
import { CreateExcursionRequest } from '@/types/types';

interface AddExcursionRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const AddExcursionRequestModal = ({ open, onOpenChange, onSave }: AddExcursionRequestModalProps) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [excursionDate, setExcursionDate] = useState('');
  const [excursionTime, setExcursionTime] = useState('');
  const [numberOfAdults, setNumberOfAdults] = useState('');
  const [numberOfChildren, setNumberOfChildren] = useState('');
  const [numberOfBabies, setNumberOfBabies] = useState('');
  const [message, setMessage] = useState('');
  const [excursionId, setExcursionId] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'completed' | 'rejected'>('pending');
  const [paymentPercentage, setPaymentPercentage] = useState<'0' | '100'>('0');
  const [price, setPrice] = useState(0);
  const [withGuide, setWithGuide] = useState(false);
  const [driverLanguages, setDriverLanguages] = useState('');
  const [errors, setErrors] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    excursionDate: '',
    excursionTime: '',
    numberOfAdults: '',
    numberOfChildren: '',
    numberOfBabies: '',
    excursionId: '',
    driverLanguages: '',
  });
  const [serverError, setServerError] = useState('');

  const { data: excursionsData } = useGetAllExcursionsQuery({ page: 1, limit: 100 });
  const excursions = excursionsData?.data?.filter(exc => exc.isAvailable) || [];
  const [createExcursionRequest, { isLoading }] = useCreateExcursionRequestMutation();

  // Calculate maximum allowed values for each input
  const maxAdults = 8 - (parseInt(numberOfChildren) || 0) - (parseInt(numberOfBabies) || 0);
  const maxChildren = 8 - (parseInt(numberOfAdults) || 0) - (parseInt(numberOfBabies) || 0);
  const maxBabies = 8 - (parseInt(numberOfAdults) || 0) - (parseInt(numberOfChildren) || 0);

  useEffect(() => {
    if (excursionId && numberOfAdults !== '' && numberOfChildren !== '' && numberOfBabies !== '') {
      const excursion = excursions.find(exc => exc._id === excursionId);
      if (excursion) {
        const totalPeople = parseInt(numberOfAdults) + parseInt(numberOfChildren) + parseInt(numberOfBabies);
        let basePrice = 0;
        if (totalPeople >= 1 && totalPeople <= 4) {
          basePrice = excursion.prices.oneToFour;
        } else if (totalPeople >= 5 && totalPeople <= 6) {
          basePrice = excursion.prices.fiveToSix;
        } else if (totalPeople >= 7 && totalPeople <= 8) {
          basePrice = excursion.prices.sevenToEight;
        }
        setPrice(withGuide ? basePrice + 200 : basePrice);
      } else {
        setPrice(0);
      }
    } else {
      setPrice(0);
    }
  }, [excursionId, numberOfAdults, numberOfChildren, numberOfBabies, withGuide, excursions]);

  const validateForm = () => {
    const newErrors = {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      excursionDate: '',
      excursionTime: '',
      numberOfAdults: '',
      numberOfChildren: '',
      numberOfBabies: '',
      excursionId: '',
      driverLanguages: '',
    };
    let isValid = true;

    if (!clientName.trim()) {
      newErrors.clientName = 'Le nom du client est requis';
      isValid = false;
    }
    if (!clientEmail.trim()) {
      newErrors.clientEmail = "L'email est requis";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(clientEmail)) {
      newErrors.clientEmail = "L'email est invalide";
      isValid = false;
    }
    if (!clientPhone.trim()) {
      newErrors.clientPhone = 'Le téléphone est requis';
      isValid = false;
    }
    if (!excursionDate) {
      newErrors.excursionDate = 'La date est requise';
      isValid = false;
    }
    if (!excursionTime) {
      newErrors.excursionTime = "L'heure est requise";
      isValid = false;
    }
    if (!excursionId) {
      newErrors.excursionId = 'Veuillez sélectionner une excursion';
      isValid = false;
    }
    if (withGuide && !driverLanguages.trim()) {
      newErrors.driverLanguages = 'Les langues du guide sont requises';
      isValid = false;
    }
    const adults = parseInt(numberOfAdults) || 0;
    const children = parseInt(numberOfChildren) || 0;
    const babies = parseInt(numberOfBabies) || 0;
    const totalPeople = adults + children + babies;

    if (adults < 0 || adults > maxAdults) {
      newErrors.numberOfAdults = `Nombre d'adultes doit être entre 0 et ${maxAdults}`;
      isValid = false;
    }
    if (children < 0 || children > maxChildren) {
      newErrors.numberOfChildren = `Nombre d'enfants doit être entre 0 et ${maxChildren}`;
      isValid = false;
    }
    if (babies < 0 || babies > maxBabies) {
      newErrors.numberOfBabies = `Nombre de bébés doit être entre 0 et ${maxBabies}`;
      isValid = false;
    }
    if (totalPeople > 8) {
      newErrors.numberOfAdults = 'Le nombre total de personnes ne doit pas dépasser 8';
      isValid = false;
    }
    if (totalPeople < 1) {
      newErrors.numberOfAdults = 'Le nombre total de personnes doit être au moins 1';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setErrors({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      excursionDate: '',
      excursionTime: '',
      numberOfAdults: '',
      numberOfChildren: '',
      numberOfBabies: '',
      excursionId: '',
      driverLanguages: '',
    });

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return;
    }

    try {
      const data: CreateExcursionRequest = {
        clientName,
        clientEmail,
        clientPhone,
        excursionDate,
        excursionTime,
        numberOfAdults: parseInt(numberOfAdults),
        numberOfChildren: parseInt(numberOfChildren),
        numberOfBabies: parseInt(numberOfBabies),
        message: message? message : '',
        excursionId,
        paymentPercentage: status === 'confirmed' ? parseInt(paymentPercentage) as 0 | 100 : 0,
        withGuide,
        driverLanguages: withGuide == true ? driverLanguages : '',
      };

      console.log('Sending data:', data);

      await createExcursionRequest(data).unwrap();
      toast.success("Demande d'excursion créée avec succès", {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      onSave();
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to create excursion request:', err);
      const errorMessage = err?.data?.message || "Échec de la création de la demande d'excursion";
      setServerError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  const resetForm = () => {
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setExcursionDate('');
    setExcursionTime('');
    setNumberOfAdults('');
    setNumberOfChildren('');
    setNumberOfBabies('');
    setMessage('');
    setExcursionId('');
    setStatus('pending');
    setPaymentPercentage('0');
    setPrice(0);
    setWithGuide(false);
    setDriverLanguages('');
    setErrors({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      excursionDate: '',
      excursionTime: '',
      numberOfAdults: '',
      numberOfChildren: '',
      numberOfBabies: '',
      excursionId: '',
      driverLanguages: '',
    });
    setServerError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-admin-card border-admin-border">
        <DialogHeader>
          <DialogTitle className="text-admin-foreground">Ajouter une Demande d'Excursion</DialogTitle>
        </DialogHeader>
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="clientName" className="text-admin-foreground">Nom du Client</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="bg-admin-bg border-admin-border text-admin-foreground"
              required
            />
            {errors.clientName && <p className="text-red-500 text-sm">{errors.clientName}</p>}
          </div>
          <div>
            <Label htmlFor="clientEmail" className="text-admin-foreground">Email</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="bg-admin-bg border-admin-border text-admin-foreground"
              required
            />
            {errors.clientEmail && <p className="text-red-500 text-sm">{errors.clientEmail}</p>}
          </div>
          <div>
            <Label htmlFor="clientPhone" className="text-admin-foreground">Téléphone</Label>
            <Input
              id="clientPhone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="bg-admin-bg border-admin-border text-admin-foreground"
              required
            />
            {errors.clientPhone && <p className="text-red-500 text-sm">{errors.clientPhone}</p>}
          </div>
          <div>
            <Label htmlFor="excursionDate" className="text-admin-foreground">Date de l'Excursion</Label>
            <Input
              id="excursionDate"
              type="date"
              value={excursionDate}
              onChange={(e) => setExcursionDate(e.target.value)}
              className="bg-admin-bg border-admin-border text-admin-foreground"
              required
            />
            {errors.excursionDate && <p className="text-red-500 text-sm">{errors.excursionDate}</p>}
          </div>
          <div>
            <Label htmlFor="excursionTime" className="text-admin-foreground">Heure de l'Excursion</Label>
            <Input
              id="excursionTime"
              type="time"
              value={excursionTime}
              onChange={(e) => setExcursionTime(e.target.value)}
              className="bg-admin-bg border-admin-border text-admin-foreground"
              required
            />
            {errors.excursionTime && <p className="text-red-500 text-sm">{errors.excursionTime}</p>}
          </div>
          <div>
            <Label htmlFor="excursionId" className="text-admin-foreground">Excursion</Label>
            <Select value={excursionId} onValueChange={setExcursionId}>
              <SelectTrigger className="bg-admin-bg border-admin-border text-admin-foreground">
                <SelectValue placeholder="Sélectionner une excursion" />
              </SelectTrigger>
              <SelectContent>
                {excursions.length > 0 ? (
                  excursions.map((excursion) => (
                    <SelectItem key={excursion._id} value={excursion._id}>
                      {excursion.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Aucune excursion disponible
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.excursionId && <p className="text-red-500 text-sm">{errors.excursionId}</p>}
          </div>
          <div>
            <Label htmlFor="numberOfAdults" className="text-admin-foreground">Nombre d'Adultes (+12 ans)</Label>
            <Input
              id="numberOfAdults"
              type="number"
              min="0"
              max={maxAdults}
              value={numberOfAdults}
              onChange={(e) => setNumberOfAdults(e.target.value)}
              className="bg-admin-bg border-admin-border text-admin-foreground"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">Max {maxAdults} adultes</p>
            {errors.numberOfAdults && <p className="text-red-500 text-sm">{errors.numberOfAdults}</p>}
          </div>
          <div>
            <Label htmlFor="numberOfChildren" className="text-admin-foreground">Nombre d'Enfants (2-12 ans)</Label>
            <Input
              id="numberOfChildren"
              type="number"
              min="0"
              max={maxChildren}
              value={numberOfChildren}
              onChange={(e) => setNumberOfChildren(e.target.value)}
              className="bg-admin-bg border-admin-border text-admin-foreground"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">Max {maxChildren} enfants</p>
            {errors.numberOfChildren && <p className="text-red-500 text-sm">{errors.numberOfChildren}</p>}
          </div>
          <div>
            <Label htmlFor="numberOfBabies" className="text-admin-foreground">Nombre de Bébés (0-2 ans)</Label>
            <Input
              id="numberOfBabies"
              type="number"
              min="0"
              max={maxBabies}
              value={numberOfBabies}
              onChange={(e) => setNumberOfBabies(e.target.value)}
              className="bg-admin-bg border-admin-border text-admin-foreground"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">Max {maxBabies} bébés</p>
            {errors.numberOfBabies && <p className="text-red-500 text-sm">{errors.numberOfBabies}</p>}
          </div>
          <div>
            <Label htmlFor="withGuide" className="text-admin-foreground">Avec Guide (+200 TND)</Label>
            <Checkbox
              id="withGuide"
              checked={withGuide}
              onCheckedChange={(checked) => {
                setWithGuide(checked as boolean);
                if (!checked) setDriverLanguages('');
              }}
              className="ml-2"
            />
          </div>
          {withGuide && (
            <div>
              <Label htmlFor="driverLanguages" className="text-admin-foreground">Langues du Guide</Label>
              <Textarea
                id="driverLanguages"
                value={driverLanguages}
                onChange={(e) => setDriverLanguages(e.target.value)}
                className="bg-admin-bg border-admin-border text-admin-foreground"
                placeholder="Entrez les langues souhaitées (ex: Français, Anglais)"
                required
              />
              {errors.driverLanguages && <p className="text-red-500 text-sm">{errors.driverLanguages}</p>}
            </div>
          )}
          <div>
            <Label htmlFor="price" className="text-admin-foreground">Prix Total</Label>
            <Input
              id="price"
              type="number"
              value={price}
              readOnly
              className="bg-admin-bg border-admin-border text-admin-foreground opacity-50"
            />
          </div>
          <div>
            <Label htmlFor="status" className="text-admin-foreground">Statut</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as 'pending' | 'confirmed' | 'completed' | 'rejected')}>
              <SelectTrigger className="bg-admin-bg border-admin-border text-admin-foreground">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En Attente</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {status === 'confirmed' && (
            <div>
              <Label htmlFor="paymentPercentage" className="text-admin-foreground">Pourcentage de Paiement</Label>
              <Select value={paymentPercentage} onValueChange={(value) => setPaymentPercentage(value as '0' | '100')}>
                <SelectTrigger className="bg-admin-bg border-admin-border text-admin-foreground">
                  <SelectValue placeholder="Sélectionner un pourcentage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="100">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="message" className="text-admin-foreground">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-admin-bg border-admin-border text-admin-foreground"
            />
          </div>
          {serverError && <p className="text-red-500 text-sm">{serverError}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="text-gray-900 border-admin-border"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || Object.values(errors).some((err) => err !== '')}
              className="bg-admin-foreground text-admin-bg hover:bg-gray-300"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExcursionRequestModal;