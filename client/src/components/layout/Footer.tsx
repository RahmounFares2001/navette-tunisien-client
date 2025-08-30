import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();

  const quickLinks = [
    { path: '/', key: 'home' },
    { path: '/transfers', key: 'transfers' },
    { path: '/excursions', key: 'excursions' },
    { path: '/about', key: 'about' },
    { path: '/contact', key: 'contact' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
  ];

  const contactInfo = [
    { icon: Phone, text: '+216 22 51 15 12' },
    { icon: Mail, text: 'navetteaeroporttunis@gmail.com' },
    { icon: MapPin, text: 'Tunis, Tunisia' },
  ];

  return (
    <footer className="bg-black text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="cursor-pointer bg-orange-600 text-gray-100 px-3 py-1 rounded font-semibold text-lg inline-block mb-4">
              NavetteTunisie
            </div>
            <p className="text-sm sm:text-md text-gray-100 mb-6 max-w-md">
              {t('footer.description')}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              {contactInfo.map(({ icon: Icon, text }, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-text-gray-300 text-sm sm:text-md">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-md sm:text-lg mb-4 text-orange-500">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map(({ path, key }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className="text-sm sm:text-md text-gray-100 hover:text-primary transition-colors duration-300"
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    {t(`navigation.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-semibold text-md sm:text-lg mb-4 text-primary">
              {t('footer.followUs')}
            </h3>
            <div className="flex space-x-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="bg-orange-600/80 text-primary-foreground p-2 sm:p-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                  aria-label={label}
                >
                  <Icon className="h-4 sm:h-5 w-5 sm:w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-gray-200 text-sm">
            &copy; {new Date().getFullYear()} NavetteTunisie. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;