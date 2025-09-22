// src/pages/BlogDetails.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetBlogQuery, apiSlice } from '@/globalRedux/features/api/apiSlice';
import { RootState } from '@/globalRedux/store';
import { IBlogResponse } from '@/types/types';
import SeoConfig from '@/seo/SeoConfig';

const BlogDetails = () => {
  const { id } = useParams<{ id: string }>(); // Only need id, slug is ignored
  const { t, i18n } = useTranslation();

  // Check Redux store for pre-fetched data
  const initialBlogData = useSelector((state: RootState) =>
    state[apiSlice.reducerPath]?.queries?.[`getBlog("${id}")`]?.data
  ) as { success: boolean; data: IBlogResponse } | undefined;
  const { data: blogData, isLoading, error } = useGetBlogQuery(id || '', {
    skip: !!initialBlogData, // Skip query if data is pre-fetched
  });
  const blog = initialBlogData?.data || blogData?.data;

  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedDescription, setTranslatedDescription] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Translation logic with caching
  useEffect(() => {
    if (!blog) return;

    const cacheKey = `blog_${blog._id}_${i18n.language}_v1`;

    // Fast Google Translate with minimal delays
    const translateWithGoogle = async (text: string, targetLang: string) => {
      try {
        const maxChunkSize = 4500;
        const chunks = [];
        if (text.length <= maxChunkSize) {
          chunks.push(text);
        } else {
          const sentences = text.split(/(?<=[.!?])\s+/);
          let currentChunk = '';
          for (const sentence of sentences) {
            if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
              chunks.push(currentChunk.trim());
              currentChunk = sentence;
            } else {
              currentChunk += (currentChunk ? ' ' : '') + sentence;
            }
          }
          if (currentChunk) chunks.push(currentChunk.trim());
        }

        const chunkPromises = chunks.map(async (chunk, index) => {
          await new Promise(resolve => setTimeout(resolve, index * 300));
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${targetLang}&dt=t&q=${encodeURIComponent(chunk)}`;
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          let result = '';
          if (data && Array.isArray(data) && data[0] && Array.isArray(data[0])) {
            for (const segment of data[0]) {
              if (Array.isArray(segment) && segment[0]) {
                result += segment[0];
              }
            }
          }
          return result || chunk;
        });

        const translatedChunks = await Promise.all(chunkPromises);
        return translatedChunks.join('');
      } catch (error) {
        console.warn('Google translate failed:', error);
        throw error;
      }
    };

    const translateText = async (text: string, targetLang: string) => {
      if (text.length < 5) return text;
      try {
        const result = await translateWithGoogle(text, targetLang);
        if (result && result.length > text.length * 0.2) {
          return result;
        }
      } catch (error) {
        console.warn('Translation failed, using original:', error);
      }
      return text;
    };

    const translateFields = async () => {
      setIsTranslating(true);
      const targetLang = i18n.language;

      if (targetLang === 'fr') {
        setTranslatedTitle(blog.title);
        setTranslatedDescription(blog.description);
        setIsTranslating(false);
        return;
      }

      try {
        const cachedTranslation = localStorage.getItem(cacheKey);
        if (cachedTranslation) {
          const parsed = JSON.parse(cachedTranslation);
          if (parsed.description && parsed.description.length > 50) {
            setTranslatedTitle(parsed.title);
            setTranslatedDescription(parsed.description);
            setIsTranslating(false);
            return;
          }
        }
      } catch (e) {
        // Ignore cache errors
      }

      try {
        const [translatedTitle, translatedDescription] = await Promise.all([
          translateText(blog.title, targetLang),
          translateText(blog.description, targetLang),
        ]);

        setTranslatedTitle(translatedTitle);
        setTranslatedDescription(translatedDescription);

        setTimeout(() => {
          try {
            const cacheData = {
              title: translatedTitle,
              description: translatedDescription,
              timestamp: Date.now(),
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
          } catch (e) {
            // Ignore cache errors
          }
        }, 100);
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslatedTitle(blog.title);
        setTranslatedDescription(blog.description);
      }
      setIsTranslating(false);
    };

    translateFields();
  }, [blog, i18n.language]);

  if (isLoading && !initialBlogData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground">{t('blogDetails.loading')}</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{t('blogDetails.error')}</p>
      </div>
    );
  }

  return (
    <>
      <SeoConfig
        title={`${blog.title} - Navette Tunisie`}
        description="Lisez les détails de nos articles sur le tourisme et les expériences en Tunisie avec Navette Tunisie"
        keywords="article Tunisie, blog voyage Tunisie, Navette Tunisie, tourisme Tunisie"
        url={`/blog/${id}`}
      />
      <div className="mb-20 py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link to="/blogs">
              <Button
                variant="outline"
                className="flex items-center rounded-full px-4 hover:bg-gray-100 hover:text-gray-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('blogDetails.backButton')}
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-3 shadow-lg rounded-xl">
              <CardContent className="p-0 sm:p-6">
                <div className="relative h-80 sm:h-96 rounded-lg overflow-hidden mb-6">
                  <img
                    src={`${import.meta.env.VITE_API_IMG}${blog.imgUrl}`}
                    alt={translatedTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>

                <h1 className="md:mt-14 text-md sm:text-xl lg:text-2xl font-bold text-foreground mb-4">
                  {isTranslating ? t('blogDetails.translating') : translatedTitle}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  {new Date(blog.createdAt).toLocaleDateString()}
                </p>
                <div className="pb-5 prose max-w-none text-muted-foreground">
                  <p className="text-xs sm:text-sm lg:text-base text-justify leading-relaxed whitespace-pre-line">
                    {isTranslating ? t('blogDetails.translating') : translatedDescription}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default BlogDetails;