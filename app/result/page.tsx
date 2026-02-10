'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FinalRoutePage() {
  const [isExpanded, setIsExpanded] = useState(false);

  const routeData = [
    { 
      id: 1, name: '인천국제공항', time: '10:00', 
      desc: '공항철도 직통열차 탑승 구역', cost: '9,500원',
      tip: '클룩 예매 시 QR 탑승 가능!',
      img: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=300&h=200&fit=crop',
      lat: '30%', lng: '20%' // 지도상 위치 시뮬레이션
    },
    { 
      id: 2, name: '명동 스테이', time: '12:00', dist: '52km', duration: '60분', 
      desc: '체크인 및 짐 보관', cost: '0원 (예약완료)',
      tip: '로비 무료 커피를 즐기세요.',
      img: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=300&h=200&fit=crop',
      lat: '50%', lng: '55%'
    },
    { 
      id: 3, name: '광장시장', time: '14:00', dist: '3.5km', duration: '15분', 
      desc: '박가네 빈대떡 추천', cost: '25,000원',
      tip: '현금을 챙겨가면 편해요.',
      img: 'https://images.unsplash.com/photo-1624300629298-e9de39c13ee5?w=300&h=200&fit=crop',
      lat: '45%', lng: '75%'
    },
  ];

  return (
    <main className="relative h-screen w-full bg-slate-100 overflow-hidden font-[Pretendard]">
      
      {/* 1. 지도 영역 (복구 완료!) */}
      <section className="absolute inset-0 z-0 bg-slate-200">
        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/127.02,37.52,12.5,0/1200x800?access_token=YOUR_TOKEN')] bg-cover bg-center grayscale-[0.2]"></div>

        {/* 경로 엣지 & 노드 오버레이 */}
        <div className="absolute inset-0 pointer-events-none">
          
          {/* 노드 1 -> 2 연결 엣지 데이터 (2행 라벨) */}
          <div className="absolute top-[43%] left-[38%] pointer-events-auto z-10">
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg border border-emerald-100 flex flex-col items-center min-w-[50px]">
              <span className="text-[10px] font-black text-slate-700 leading-tight">52km</span>
              <span className="text-[9px] font-bold text-emerald-600 leading-tight">60분</span>
            </div>
          </div>

          {/* 노드 2 -> 3 연결 엣지 데이터 */}
          <div className="absolute top-[52%] left-[68%] pointer-events-auto z-10">
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg border border-emerald-100 flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-700 leading-tight">3.5km</span>
              <span className="text-[9px] font-bold text-emerald-600 leading-tight">15분</span>
            </div>
          </div>

          {/* 방문지 포인트 & 화이트 라벨링 */}
          {routeData.map((node, idx) => (
            <div key={node.id} className="absolute pointer-events-auto flex flex-col items-center" style={{ top: node.lat, left: node.lng }}>
              <div className="bg-white px-3 py-1 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-slate-50 font-black text-[11px] text-slate-800 mb-1.5">
                {node.name}
              </div>
              <div className="w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white shadow-lg"></div>
            </div>
          ))}

          {/* 연결선 시뮬레이션 (SVG) */}
          <svg className="absolute inset-0 w-full h-full opacity-30">
            <path d="M 220 330 Q 350 450 550 500" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="8 6" />
            <path d="M 550 500 L 750 450" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="8 6" />
          </svg>
        </div>
      </section>

      {/* 2. 상단 네비 바 */}
      <div className="absolute top-5 left-5 right-5 z-20 flex justify-between items-center pointer-events-none">
        <Link href="/dashboard" className="pointer-events-auto w-11 h-11 bg-white rounded-2xl shadow-xl flex items-center justify-center text-slate-400 hover:text-emerald-600"  >
            <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <div className="pointer-events-auto bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
          <span className="text-sm font-black text-slate-800 tracking-tight italic">SEOUL MATE</span>
          <div className="w-[1px] h-3 bg-slate-200"></div>
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Day 1</span>
        </div>
        <div className="w-11"></div>
      </div>

      {/* 3. 바텀 시트 */}
        <div 
        className={`absolute inset-x-0 bottom-0 z-30 bg-white rounded-t-[45px] shadow-[0_-15px_50px_rgba(0,0,0,0.12)] transition-all duration-500 ease-in-out flex flex-col overflow-hidden ${
            isExpanded ? 'h-[85vh]' : 'h-[35vh]'
        }`}
        >
        {/* [고정] 상단 핸들 영역 */}
        <div 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="w-full pt-5 pb-3 flex flex-col items-center cursor-pointer flex-shrink-0 bg-white z-30 relative"
        >
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mb-3"></div>
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Itinerary Details</h3>
        </div>

        {/* [스크롤] 상세 목록 영역 */}
        <div className="flex-1 overflow-y-auto px-7 pb-32 custom-scrollbar relative z-10">
            {routeData.map((item, idx) => (
            <div key={item.id} className="relative pl-11 pb-10">
                {/* 네비게이션 라인 & 숫자 노드 (z-index 영향 최소화) */}
                {idx !== routeData.length - 1 && (
                <div className="absolute left-[15px] top-9 w-[2px] h-full bg-slate-50"></div>
                )}
                <div className="absolute left-0 top-1.5 w-8 h-8 rounded-2xl bg-white border-2 border-emerald-500 flex items-center justify-center z-10 shadow-sm">
                <span className="text-[12px] font-black text-emerald-600">{idx + 1}</span>
                </div>

                {/* 카드 내용 */}
                <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-start">
                    <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                        <h4 className="text-xl font-black text-slate-800 tracking-tight">{item.name}</h4>
                        <span className="text-xs font-black text-slate-300">{item.time}</span>
                    </div>
                    <p className="text-[13px] text-slate-400 font-semibold leading-relaxed mb-3 line-clamp-2">{item.desc}</p>
                    
                    <div className="flex flex-wrap gap-2">
                        <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-600">{item.cost}</span>
                        </div>
                        <div className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-emerald-700">Tip: {item.tip}</span>
                        </div>
                    </div>
                    </div>
                    {/* 이미지 영역: z-index에 영향받지 않도록 처리 */}
                    <img src={item.img} className="w-24 h-24 rounded-[28px] object-cover bg-slate-50 flex-shrink-0" alt="" />
                </div>

                {/* 이동 정보 */}
                {item.dist && (
                    <div className="flex items-center gap-5 py-4 px-6 bg-[#f8fafc] border-2 border-dashed border-slate-100 rounded-[24px]">
                    <span className="text-[11px] font-black text-slate-400">{item.dist} / {item.duration}</span>
                    </div>
                )}
                </div>
            </div>
            ))}
        </div>

        {/* [고정] 하단 플로팅 버튼 영역 - z-index 상향 및 그라데이션 추가 */}
        <div className="absolute bottom-0 inset-x-0 p-7 bg-gradient-to-t from-white via-white/90 to-transparent pt-12 z-30 pointer-events-none">
            <button className="pointer-events-auto w-full h-16 bg-slate-900 text-white rounded-[22px] font-black text-[15px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center justify-center gap-3 active:scale-[0.97] transition-all">
            <i className="fa-solid fa-map-location-dot text-emerald-400"></i>
            전체 경로 안내 시작
            </button>
        </div>
        </div>
    </main>
  );
}