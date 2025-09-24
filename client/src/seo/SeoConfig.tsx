import { Helmet } from 'react-helmet-async';

interface SeoConfigProps {
  title: string;
  description: string;
  keywords: string;
  image?: string;
  url: string;
}

const SeoConfig = ({
  title,
  description,
  keywords,
  image = '/cover.png',
  url
}: SeoConfigProps) => {
  const siteUrl = 'https://navette-tunisie.com';
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="google-site-verification" content="BrtB7w7aIy_QQy1eEqTB5YAB0-f07vUt9FuNph_JDi4" />
      <base href="/" />

      {/* Enhanced SEO Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Navette Tunisie - Expert Transport Touristique" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="language" content="fr" />
      <meta name="geo.region" content="TN-11" />
      <meta name="geo.country" content="Tunisia" />
      <meta name="geo.placename" content="Tunis, Tunisie" />
      <meta name="ICBM" content="36.8065, 10.1815" />

      {/* Business Information for Local SEO */}
      <meta name="rating" content="5" />
      <meta name="subject" content="Transferts aéroport et excursions touristiques en Tunisie" />
      <meta name="coverage" content="Worldwide" />
      <meta name="distribution" content="Global" />
      <meta name="target" content="touristes, voyageurs, vacanciers en Tunisie" />

      {/* Enhanced Open Graph Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Navette Tunisie" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:locale:alternate" content="ar_TN" />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:secure_url" content={fullImageUrl} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${title} - Navette Tunisie`} />
      <meta property="og:logo" content={`${siteUrl}/cover.png`} />
      <meta property="business:contact_data:street_address" content="Avenue Habib Bourguiba" />
      <meta property="business:contact_data:locality" content="Tunis" />
      <meta property="business:contact_data:country_name" content="Tunisie" />

      {/* Enhanced Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@NavetteTunisie" />
      <meta name="twitter:creator" content="@NavetteTunisie" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={`${title} - Navette Tunisie`} />

      {/* Additional Social Media Meta Tags */}
      <meta property="article:publisher" content="https://www.facebook.com/NavetteTunisie" />
      <meta name="pinterest-rich-pin" content="true" />

      {/* WhatsApp and Mobile Optimization */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Navette Tunisie" />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Favicons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/navetteLogo.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/navetteLogo.png" />
      <meta name="msapplication-TileImage" content="/navetteLogo.png" />

      {/* Preload Critical Assets for Performance */}
      <link rel="preload" as="image" href={fullImageUrl} />
      <link rel="dns-prefetch" href="//ajax.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//use.fontawesome.com" />
      <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />

      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#4d3378" />
      <meta name="msapplication-TileColor" content="#4d3378" />
      <meta name="application-name" content="Navette Tunisie" />
      <meta name="msapplication-tooltip" content="Transferts et Excursions en Tunisie" />
      <meta name="msapplication-starturl" content="/" />

      {/* RSS Feeds for Content Marketing */}
      <link rel="alternate" type="application/rss+xml" title="Navette Tunisie - Blog" href={`${siteUrl}/feed`} />
      <link rel="alternate" type="application/rss+xml" title="Navette Tunisie - Commentaires" href={`${siteUrl}/comments/feed`} />

      {/* Enhanced Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": ["TravelAgency", "LocalBusiness", "TransportationCompany"],
          "name": "Navette Tunisie",
          "alternateName": "Navette Tunisia",
          "description": description,
          "url": fullUrl,
          "logo": `${siteUrl}/navetteLogo.png`,
          "image": [fullImageUrl, `${siteUrl}/navetteLogo.png`],
          "sameAs": [
            "https://www.facebook.com/NavetteTunisie",
            "https://twitter.com/NavetteTunisie"
          ],
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "TN",
            "addressRegion": "Tunis",
            "addressLocality": "Tunis",
            "streetAddress": "Avenue Habib Bourguiba"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "36.8065",
            "longitude": "10.1815"
          },
          "contactPoint": [{
            "@type": "ContactPoint",
            "contactType": "Service Client",
            "availableLanguage": ["French", "Arabic", "English"],
            "areaServed": "TN",
            "hoursAvailable": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday", "Tuesday", "Wednesday", "Thursday",
                "Friday", "Saturday", "Sunday"
              ],
              "opens": "00:00",
              "closes": "23:59"
            }
          }],
          "priceRange": "€€",
          "currenciesAccepted": "TND, EUR",
          "paymentAccepted": ["Cash", "Credit Card"],
          "areaServed": {
            "@type": "Country",
            "name": "Tunisia"
          },
          "serviceArea": {
            "@type": "AdministrativeArea",
            "name": "Tunisia"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Services de Transport Touristique",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Transfert Aéroport Tunis-Carthage",
                  "description": "Service de navette aéroport 24h/24 entre l'aéroport Tunis-Carthage et votre destination"
                },
                "priceCurrency": "TND",
                "availability": "InStock",
                "validFrom": "2024-01-01"
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Excursions Sidi Bou Said",
                  "description": "Visite guidée du village pittoresque de Sidi Bou Said avec transport inclus"
                },
                "priceCurrency": "TND",
                "availability": "InStock",
                "validFrom": "2024-01-01"
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Circuits Personnalisés Tunisie",
                  "description": "Circuits touristiques sur mesure à travers la Tunisie avec chauffeur privé"
                },
                "priceCurrency": "TND",
                "availability": "InStock",
                "validFrom": "2024-01-01"
              }
            ]
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "127",
            "bestRating": "5",
            "worstRating": "1"
          },
          "hasCredential": {
            "@type": "EducationalOccupationalCredential",
            "name": "Licence Transport Touristique Tunisie"
          }
        })}
      </script>

      {/* Local Business Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Navette Tunisie",
          "@id": fullUrl,
          "url": fullUrl,
          "telephone": "+216-XX-XXX-XXX",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Avenue Habib Bourguiba",
            "addressLocality": "Tunis",
            "addressRegion": "Tunis",
            "postalCode": "1000",
            "addressCountry": "TN"
          },
          "openingHoursSpecification": [{
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday", "Tuesday", "Wednesday", "Thursday",
              "Friday", "Saturday", "Sunday"
            ],
            "opens": "00:00",
            "closes": "23:59"
          }],
          "serviceType": "Transportation Service",
          "priceRange": "€€"
        })}
      </script>

      {/* Breadcrumb Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "Accueil",
            "item": fullUrl
          }]
        })}
      </script>

      {/* Website Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Navette Tunisie",
          "url": fullUrl,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${siteUrl}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SeoConfig;