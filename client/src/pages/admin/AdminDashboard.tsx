import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Car, 
  MapPin, 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminDashboard = () => {
  const stats = [
    {
      title: 'Transferts du Jour',
      value: '12',
      icon: Car
    },
    {
      title: 'Excursions Actives',
      value: '8',
      icon: MapPin
    },
    {
      title: 'Clients ce Mois',
      value: '234',
      icon: Users
    },
    {
      title: 'Réservations en Attente',
      value: '5',
      icon: Clock
    }
  ];

  const recentActivities = [
    {
      type: 'transfer',
      message: 'Nouveau transfert réservé par Marie Dubois',
      time: 'Il y a 15 minutes',
      status: 'pending'
    },
    {
      type: 'excursion',
      message: 'Excursion Carthage confirmée pour 8 personnes',
      time: 'Il y a 1 heure',
      status: 'confirmed'
    },
    {
      type: 'transfer',
      message: 'Transfert vers l\'aéroport terminé',
      time: 'Il y a 2 heures',
      status: 'completed'
    },
    {
      type: 'excursion',
      message: 'Demande d\'excursion personnalisée reçue',
      time: 'Il y a 3 heures',
      status: 'pending'
    }
  ];

  const quickActions = [
    {
      title: 'Gérer les Transferts',
      description: 'Voir et gérer toutes les demandes de transfert',
      icon: Car,
      link: '/admin/transfers'
    },
    {
      title: 'Demandes d\'Excursions',
      description: 'Gérer les réservations d\'excursions',
      icon: Calendar,
      link: '/admin/excursion-requests'
    },
    {
      title: 'Gérer les Excursions',
      description: 'Ajouter/modifier les excursions disponibles',
      icon: MapPin,
      link: '/admin/excursions'
    },
    {
      title: 'Gérer les Véhicules',
      description: 'Gérer la flotte de véhicules',
      icon: Users,
      link: '/admin/vehicles'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8" >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-admin-foreground mb-2">
            Tableau de Bord
          </h1>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className='bg-admin-card border-dash2 rounded' >
                <CardContent className="p-6 h-32">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-1 text-gray-100">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-100">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full bg-admin-accent`}>
                      <stat.icon className={`h-6 w-6 text-gray-100`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className='bg-admin-card border-dash2' >
              <CardHeader>
                <CardTitle className='text-gray-100' >Activités Récentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-7">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 rounded-sm shadow-sm shadow-black 
                        border border-admin-border hover:bg-orange-600/70 cursor-pointer">
                    <div className="flex-shrink-0">
                      {activity.status === 'pending' && (
                        <AlertCircle className="h-5 w-5 text-gray-100" />
                      )}
                      {activity.status === 'confirmed' && (
                        <CheckCircle className="h-5 w-5 text-gray-100" />
                      )}
                      {activity.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-gray-100" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-100">
                        {activity.message}
                      </p>
                      <p className="text-xs mt-1 text-gray-100">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>


      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;