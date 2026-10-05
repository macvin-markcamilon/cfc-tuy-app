'use client';

import React from 'react';
import Image from 'next/image';

interface FamilyMinistryItem {
  code: string;
  name: string;
  tagline: string;
  description: string;
  logoSrc: string;
  accentColor: string;
  linkHref: string;
}

const FAMILY_MINISTRIES_LIST: FamilyMinistryItem[] = [
  {
    code: 'KFC',
    name: 'CFC Kids for Christ',
    tagline: 'Sharing Christ’s joy to the family and the world',
    description: 'Nurturing children aged 4 to 12 in loving Jesus and practicing Christian values.',
    logoSrc: '/images/ministries/kfc-logo.png',
    accentColor: '#e11d48',
    linkHref: 'https://couplesforchristglobal.org/cfc-kids-for-christ/',
  },
  {
    code: 'YFC',
    name: 'CFC Youth for Christ',
    tagline: 'Young people being and bringing Christ wherever they are',
    description: 'Empowering young people aged 13 to 20 to live out their Catholic faith with joy.',
    logoSrc: '/images/ministries/yfc-logo.png',
    accentColor: '#16a34a',
    linkHref: 'https://couplesforchristglobal.org/cfc-youth-for-christ/',
  },
  {
    code: 'SFC',
    name: 'CFC Singles for Christ',
    tagline: 'Every single man and woman all over the world experiencing Christ',
    description: 'Providing single men and women aged 21 to 40 a Christian support environment.',
    logoSrc: '/images/ministries/sfc-logo.png',
    accentColor: '#2563eb',
    linkHref: 'https://couplesforchristglobal.org/cfc-singles-for-christ/',
  },
  {
    code: 'HOLD',
    name: 'CFC Handmaids of the Lord',
    tagline: 'Women in the Holy Spirit joyfully proclaiming the greatness and glory of God',
    description: 'A ministry for mature women, widows, single mothers, and wives of overseas workers.',
    logoSrc: '/images/ministries/hold-logo.png',
    accentColor: '#d97706',
    linkHref: 'https://couplesforchristglobal.org/cfc-handmaids-of-the-lord/',
  },
  {
    code: 'SOLD',
    name: 'CFC Servants of the Lord',
    tagline: 'True men of God',
    description: 'A ministry for mature men, widowers, single fathers, and husbands away from home.',
    logoSrc: '/images/ministries/sold-logo.png',
    accentColor: '#881337',
    linkHref: 'https://couplesforchristglobal.org/cfc-servants-of-the-lord/',
  },
];

export default function MinistriesGrid() {
  return (
    <section id="family-ministries" className="py-16 sm:py-20 lg:py-24 bg-[#f3f4f6] border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
        
        {/* Header Block matching official website */}
        <div className="max-w-3xl mx-auto space-y-3">
          <p className="font-serif italic text-lg sm:text-xl font-bold text-[#243c81]">
            The Family Ministries
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-slate-900 tracking-tight leading-tight">
            We seek the renewal of Christian Family Life
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
            CFC is comprised of family evangelizers that set the world on fire with the fullness of God&apos;s transforming love.
          </p>
        </div>

        {/* 5 Official Family Ministries Logos Row (Aligned with Footer Links) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6 items-end pt-4">
          {FAMILY_MINISTRIES_LIST.map((ministry) => (
            <a
              key={ministry.code}
              href={ministry.linkHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center justify-end p-4 rounded-3xl hover:bg-white/80 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              title={`Visit official ${ministry.name} page`}
            >
              {/* Official Ministry Logo */}
              <div className="relative w-32 h-36 sm:w-36 sm:h-40 flex items-center justify-center mb-4 p-2 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={ministry.logoSrc}
                  alt={ministry.name}
                  width={180}
                  height={220}
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>

              {/* Title under logo matching screenshot typography */}
              <h3 className="font-serif italic font-black text-slate-900 text-sm sm:text-base md:text-lg group-hover:text-[#243c81] transition-colors leading-tight">
                {ministry.name}
              </h3>

              {/* Short Tagline */}
              <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {ministry.tagline}
              </p>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
