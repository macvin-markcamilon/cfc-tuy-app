import React from 'react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative bg-white w-full h-[500px] flex items-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Left-aligned Text (No Logo, No Gradients, Solid Dark Colors) */}
          <div className="lg:col-span-6 text-left flex flex-col items-start justify-center">
            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[42px] xl:text-[50px] font-black text-slate-900 tracking-tight leading-[1.12]">
              Families in the Holy Spirit Renewing the Face of{' '}
              <span className="text-[#243c81]">
                Tuy, Batangas
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed font-medium max-w-xl">
              A vibrant community of Catholic couples, youth, and singles united in prayer, pastoral care, and joyful evangelization across all barangays of Tuy.
            </p>
          </div>

          {/* Right Column: Much Bigger Holy Family Image */}
          <div className="lg:col-span-6 flex items-center justify-center lg:justify-end h-full">
            <div className="relative w-full flex items-center justify-center lg:justify-end">
              <Image
                src="/images/holy-family.png"
                alt="Holy Family - Couples for Christ"
                width={850}
                height={550}
                className="w-full max-w-[480px] sm:max-w-[540px] lg:max-w-[600px] xl:max-w-[660px] max-h-[460px] object-contain drop-shadow-xs"
                priority
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
