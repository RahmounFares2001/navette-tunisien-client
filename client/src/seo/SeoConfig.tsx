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
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta property="og:site_name" content="Navette Tunisie" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:secure_url" content={fullImageUrl} />
      <meta property="og:image:alt" content={`${title} - Navette Tunisie`} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={`${title} - Navette Tunisie`} />
      <link rel="canonical" href={fullUrl} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": "Transportation Service",
          "provider": {
            "@type": "TravelAgency",
            "name": "Navette Tunisie",
            "url": siteUrl,
            "logo": `${siteUrl}/navetteLogo.png`
          },
          "name": title,
          "description": description,
          "url": fullUrl,
          "areaServed": {
            "@type": "Country",
            "name": "Tunisia"
          },
          "offers": {
            "@type": "Offer",
            "name": title,
            "description": description,
            "priceCurrency": "TND",
            "availability": "InStock",
            "validFrom": "2024-01-01",
            "url": fullUrl
          }
        })}
      </script>
    </Helmet>
  );
};

export default SeoConfig;