import { Helmet } from 'react-helmet-async';

interface SeoConfigProps {
  title: string;
  description: string;
  keywords: string;
  image?: string;
  url: string;
  type?: string;
  locale?: string;
}

const SeoConfig = ({ 
  title, 
  description, 
  keywords, 
  image = '/cover.png', 
  url,
  type = 'website',
  locale = 'fr_FR'
}: SeoConfigProps) => {
  const siteUrl = 'https://navette-tunisie.com'; 
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Navette Tunisie" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="fr" />
      <meta name="geo.region" content="TN" />
      <meta name="geo.country" content="Tunisia" />
      <meta name="geo.placename" content="Tunisie" />
      
      {/* Facebook App ID - Optional, remove if you don't have one */}
      {/* <meta property="fb:admins" content="100000000000000" /> */}
      
      {/* Enhanced Open Graph Meta Tags for Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Navette Tunisie" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content="ar_TN" />
      
      {/* SHARING IMAGE for Facebook/Messenger - Force cover.png only */}
      <meta property="og:image" content={`${siteUrl}/cover.png?v=4`} />
      <meta property="og:image:secure_url" content={`${siteUrl}/cover.png?v=4`} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${title} - Service de transferts et excursions en Tunisie`} />
      
      {/* Force Facebook to ignore any other images and use only cover.png */}
      <meta property="og:logo" content={`${siteUrl}/cover.png`} />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@NavetteTunisie" />
      <meta name="twitter:creator" content="@NavetteTunisie" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}/cover.png`} />
      <meta name="twitter:image:alt" content={`${title} - Transferts et Excursions en Tunisie`} />
      
      {/* WhatsApp compatibility */}
      <meta name="format-detection" content="telephone=no" />
      
      <link rel="canonical" href={fullUrl} />
      
      {/* Preload the sharing image - cover.png only */}
      <link rel="preload" as="image" href={`${siteUrl}/cover.png`} />
      
      {/* Enhanced Schema.org for Car Rental Business */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CarRental",
          "name": "Navette Tunisie",
          "description": description,
          "url": siteUrl,
          "logo": `${siteUrl}/navetteLogo.png`,
          "image": `${siteUrl}/cover.png`,
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "TN",
            "addressRegion": "Tunisie"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Service Client",
            "availableLanguage": ["French", "Arabic"]
          },
          "priceRange": "$$",
          "areaServed": {
            "@type": "Country",
            "name": "Tunisia"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Transferts et Excursions",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Navettes Aéroport"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Excursions Touristiques"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Transferts Privés"
                }
              }
            ]
          }
        })}
      </script>
    </Helmet>
  );
};

export default SeoConfig;