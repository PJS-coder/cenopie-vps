'use client';

import { SparklesIcon } from '@heroicons/react/24/solid';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface SponsoredAdProps {
  title: string;
  description: string;
  image?: string;
  ctaText: string;
  ctaLink: string;
  sponsor: string;
}

export default function SponsoredAd({
  title,
  description,
  image,
  ctaText,
  ctaLink,
  sponsor
}: SponsoredAdProps) {
  return (
    <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-2 border-cyan-200 dark:border-cyan-800 rounded-lg shadow-sm overflow-hidden">
      {/* Sponsored Badge */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-white" />
          <span className="text-white text-xs font-semibold uppercase tracking-wide">Sponsored</span>
        </div>
        <span className="text-white/80 text-xs">{sponsor}</span>
      </div>

      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Image */}
          {image && (
            <div className="w-full md:w-32 h-32 bg-white rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={image}
                alt={title}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {description}
            </p>
            <a
              href={ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg"
            >
              {ctaText}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
