'use client';

import React from 'react';
import { ExternalLink, ThumbsUp, MessageSquare, Share2, Calendar, MapPin, Heart, Sparkles } from 'lucide-react';

const FacebookIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

interface FacebookPost {
  id: string;
  author: string;
  date: string;
  badge: string;
  content: string;
  location: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  imageBg: string;
}

const POPULATED_POSTS: FacebookPost[] = [
  {
    id: 'post-1',
    author: 'Couples for Christ - Tuy',
    date: 'Recent Update • 2 days ago',
    badge: 'Christian Life Program',
    content: 'Praise God! The Christian Life Program (CLP) Batch is currently ongoing at Saint Vincent Ferrer Parish Hall, Tuy. Join us every Sunday at 1:00 PM for talks, discussion circles, and uplifting praise and worship.',
    location: 'St. Vincent Ferrer Parish Hall, Tuy, Batangas',
    likesCount: 142,
    commentsCount: 28,
    sharesCount: 19,
    imageBg: 'from-[#243c81] to-indigo-900',
  },
  {
    id: 'post-2',
    author: 'Couples for Christ - Tuy',
    date: 'Chapter Announcement',
    badge: 'General Assembly',
    content: 'All CFC Tuy married couples, HOLD, SOLD, SFC, YFC, and KFC members are invited to our upcoming Chapter General Assembly and Worship Night. Let us gather as one family in Christ!',
    location: 'Tuy Parish Gymnasium, Tuy, Batangas',
    likesCount: 189,
    commentsCount: 34,
    sharesCount: 25,
    imageBg: 'from-amber-600 to-orange-800',
  },
  {
    id: 'post-3',
    author: 'Couples for Christ - Tuy',
    date: 'Pastoral & Household Fellowship',
    badge: 'Tuy Community Outreach',
    content: 'Praying with and for families across all 22 barangays of Tuy. Reach out to your household leaders for prayer requests, pastoral visits, and fellowship schedules.',
    location: 'Tuy Chapter Secretariat, Batangas',
    likesCount: 116,
    commentsCount: 15,
    sharesCount: 12,
    imageBg: 'from-emerald-700 to-teal-900',
  },
];

export default function FacebookSection() {
  return (
    <section id="facebook-feed" className="py-16 sm:py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black uppercase tracking-wider">
              <FacebookIcon className="w-4 h-4 text-blue-600" />
              <span>Official Facebook Community</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Follow CFC Tuy on Facebook
            </h2>
            <p className="text-sm text-slate-600 font-medium max-w-xl">
              Stay connected with <strong className="text-blue-700 font-bold">@cfctuy</strong> for live announcements, CLP updates, household assembly schedules, and community highlights.
            </p>
          </div>

          <a
            href="https://www.facebook.com/cfctuy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1877f2] hover:bg-blue-700 text-white font-black text-sm shadow-md transition-all active:scale-95 shrink-0 self-start md:self-auto"
          >
            <FacebookIcon className="w-5 h-5 text-white" />
            <span>Visit @cfctuy on Facebook</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Content Layout: 3 Populated Posts Grid + Facebook Page Embed Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 3 Populated Posts (8 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Recent Community Updates</span>
              <span className="text-blue-600 font-bold">facebook.com/cfctuy</span>
            </div>

            {POPULATED_POSTS.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center font-black shadow-xs shrink-0">
                      <FacebookIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <span>{post.author}</span>
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        {post.date}
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-100">
                    {post.badge}
                  </span>
                </div>

                {/* Post Content */}
                <div className="p-5 space-y-3">
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{post.location}</span>
                  </div>
                </div>

                {/* Post Footer Bar */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-blue-600">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{post.likesCount}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span>{post.commentsCount}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-4 h-4 text-slate-400" />
                      <span>{post.sharesCount}</span>
                    </span>
                  </div>

                  <a
                    href="https://www.facebook.com/cfctuy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs font-black inline-flex items-center gap-1"
                  >
                    <span>View on Facebook</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Facebook Official Iframe / Page Plugin Container (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <FacebookIcon className="w-4 h-4" />
                </span>
                <h3 className="font-black text-slate-900 text-sm">Official Facebook Page Feed</h3>
              </div>
              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Active Page
              </span>
            </div>

            {/* Embedded Facebook Page iFrame Plugin */}
            <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden min-h-[460px] flex items-center justify-center">
              <iframe
                src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fcfctuy&tabs=timeline&width=380&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true"
                width="100%"
                height="500"
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                frameBorder="0"
                allowFullScreen={true}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                className="w-full h-[500px]"
              />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
