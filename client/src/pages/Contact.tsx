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
import axios from 'axios';

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
      title: t('phone'),
      details: ['+216 22 51 15 12'],
      description: '24h/24 7j/7'
    },
    {
      icon: Mail,
      title: t('email'),
      details: ['navetteaeroporttunis@gmail.com'],
    },
    {
      icon: MapPin,
      title: t('adresse'),
      details: [
        <a
          key="map-link"
          href="https://www.google.com/maps/place/Web+Rent+a+car.+Location+de+voitures.+./@36.4057479,10.5754942,17z/data=!3m1!4b1!4m6!3m5!1s0x12fd61c5493e067d:0xc1cb8e56a6427da6!8m2!3d36.4057436!4d10.5780691!16s%2Fg%2F11r105mt4g?entry=ttu&g_ep=EgoyMDI1MDkwMy4wIKXMDSoASAFQAw%3D%3D"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Navette Tunisie
        </a>
      ],
    },
    {
      icon: Clock,
      title: t('horaires'),
      details: ['Lun-Ven: 08:00 - 18:00', 'Sam-Dim: 09:00 - 17:00'],
    }
  ];

  const [isSubmit, setIsSubmit] = useState(false);

  const handleSubmit = async () => {
    setIsSubmit(true);
    if (!formData.fullName || !formData.email || !formData.message) {
      setIsSubmit(false);

      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE}/api/contact`, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        subject: 'Contact Form Submission',
        message: formData.message
      });

      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });

      setIsSubmit(false);
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      setIsSubmit(false);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre message.",
        variant: "destructive",
      });
    }
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
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
                {t('contact.informations.title')}
              </h2>
              <p className="text-md sm:text-lg text-muted-foreground mb-8 leading-relaxed">
                {t('contact.informations.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="bg-gradient-hero text-primary-foreground w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0">
                          <info.icon className="h-4 w-4" />
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
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="pt-5">
              <CardContent className="sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
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
                      placeholder={t('contact.inputName')}
                      className="mt-1 text-sm sm:text-lg"
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
                      className="mt-1 text-sm sm:text-lg"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone">{t('forms.phone')}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+..."
                      className="mt-1 text-sm sm:text-lg"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="message">{t('forms.message')} *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder={t('contact.inputMessage')}
                      rows={6}
                      className="mt-1 text-sm sm:text-lg"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    onClick={handleSubmit}
                    size="lg"
                    className="w-full btn-orange"
                  >
                    <Send className="mr-2 h-5 w-5" />
                    {t('forms.submit')} {isSubmit && ' ...'}
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

export default Contact;