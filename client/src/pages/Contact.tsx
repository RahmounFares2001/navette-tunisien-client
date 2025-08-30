import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const Contact = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });

  const contactInfo = [
    {
      icon: Phone,
      title: 'Téléphone',
      details: ['+216 12 345 678', '+216 98 765 432'],
      description: 'Appelez-nous 24h/24 et 7j/7'
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['info@navettetunisie.com', 'reservations@navettetunisie.com'],
      description: 'Réponse garantie sous 24h'
    },
    {
      icon: MapPin,
      title: 'Adresse',
      details: ['123 Avenue Habib Bourguiba', 'Tunis 1000, Tunisie'],
      description: 'Venez nous rendre visite'
    },
    {
      icon: Clock,
      title: 'Horaires',
      details: ['Lun-Ven: 08:00 - 18:00', 'Sam-Dim: 09:00 - 17:00'],
      description: 'Support client disponible'
    }
  ];

  const handleSubmit = () => {
    if (!formData.fullName || !formData.email || !formData.message) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Mock form submission
    console.log('Contact form:', formData);
    
    toast({
      title: "Message envoyé !",
      description: "Nous vous répondrons dans les plus brefs délais.",
    });

    // Reset form
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      message: ''
    });
  };

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
            {t('contact.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('contact.getInTouch')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Informations de Contact
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Notre équipe est à votre disposition pour répondre à toutes vos questions 
                et vous aider à planifier votre séjour en Tunisie.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                >
                  <Card className="card-elegant h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gradient-hero text-primary-foreground w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                          <info.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-2">
                            {info.title}
                          </h3>
                          {info.details.map((detail, i) => (
                            <p key={i} className="text-muted-foreground text-sm mb-1">
                              {detail}
                            </p>
                          ))}
                          <p className="text-xs text-muted-foreground mt-2">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Map Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card className="card-elegant">
                <CardContent className="p-0">
                  <div className="h-64 bg-gradient-sand rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">
                        Carte Google Maps
                      </p>
                      <p className="text-sm text-muted-foreground">
                        123 Avenue Habib Bourguiba, Tunis
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="card-elegant">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t('contact.sendMessage')}
                </h2>
                
                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <Label htmlFor="fullName">{t('forms.fullName')} *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Votre nom complet"
                      className="mt-1"
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
                      className="mt-1"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone">{t('forms.phone')}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+216 12 345 678"
                      className="mt-1"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="message">{t('forms.message')} *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Votre message..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    onClick={handleSubmit}
                    size="lg"
                    className="w-full btn-hero"
                  >
                    <Send className="mr-2 h-5 w-5" />
                    {t('forms.submit')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8"
            >
              <Card className="card-elegant">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">
                    Demandes d'Urgence
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Pour toute demande urgente ou assistance immédiate pendant votre séjour :
                  </p>
                  <div className="flex items-center space-x-2 text-primary font-semibold">
                    <Phone className="h-4 w-4" />
                    <span>+216 99 888 777</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ligne d'urgence disponible 24h/24
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;