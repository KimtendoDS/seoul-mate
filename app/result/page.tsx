'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';

export default function FinalRoutePage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const mapRef = useRef<any>(null);
  const isMapInitialized = useRef(false); // 지도가 이미 초기화되었는지 추적

  const routeData = [
    { 
      id: 1, name: '인천국제공항', time: '10:00', 
      desc: '공항철도 직통열차 탑승 구역', cost: '9,500원',
      tip: '클룩 예매 시 QR 탑승 가능!',
      img: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=300&h=200&fit=crop',
      lat: 37.4602, lng: 126.4407 
    },
    { 
      id: 2, name: '명동 스테이', time: '12:00', dist: '52km', duration: '60분', 
      desc: '체크인 및 짐 보관', cost: '0원 (예약완료)',
      tip: '로비 무료 커피를 즐기세요.',
      img: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=300&h=200&fit=crop',
      lat: 37.5635, lng: 126.9850
    },
    { 
      id: 3, name: '광장시장', time: '14:00', dist: '3.5km', duration: '15분', 
      desc: '박가네 빈대떡 추천', cost: '25,000원',
      tip: '현금을 챙겨가면 편해요.',
      img: 'https://images.unsplash.com/photo-1624300629298-e9de39c13ee5?w=300&h=200&fit=crop',
      lat: 37.5701, lng: 126.9993
    },
  ];

  // 네이버 지도 초기화 함수
  const initMap = () => {
    const { naver } = window as any;
    const mapElement = document.getElementById('map');

    // naver 객체가 없거나, DOM이 없거나, 이미 지도가 그려졌다면 중단
    if (!naver || !mapElement || isMapInitialized.current) return;

    isMapInitialized.current = true; // 자물쇠 잠금

    const mapOptions = {
      center: new naver.maps.LatLng(routeData[1].lat, routeData[1].lng),
      zoom: 12,
      minZoom: 10,
      zoomControl: false,
      logoControl: false,
      mapDataControl: false,
    };

    const map = new naver.maps.Map(mapElement, mapOptions);
    mapRef.current = map;

    const pathCoords: any[] = [];

    // 장소 마커 및 이름표 추가
    routeData.forEach((item) => {
      const pos = new naver.maps.LatLng(item.lat, item.lng);
      pathCoords.push(pos);

      new naver.maps.Marker({
        position: pos,
        map: map,
        icon: {
          content: `
            <div style="display:flex; flex-direction:column; align-items:center;">
              <div style="background:white; padding:5px 12px; border-radius:18px; border:2px solid #10b981; font-weight:900; font-size:12px; margin-bottom:6px; box-shadow:0 4px 12px rgba(0,0,0,0.15); white-space:nowrap; color:#1e293b;">
                ${item.name}
              </div>
              <div style="width:18px; height:18px; background:#10b981; border:3px solid white; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>
            </div>`,
          anchor: new naver.maps.Point(15, 45),
        }
      });
    });

    // 경로 점선 추가
    new naver.maps.Polyline({
      map: map,
      path: pathCoords,
      strokeColor: '#10b981',
      strokeWeight: 4,
      strokeStyle: 'dash',
      strokeOpacity: 0.6
    });

    console.log("✅ Naver Map Loaded with Key:", process.env.NEXT_PUBLIC_NAVER_CLIENT_ID);
  };

  // 🔥 핵심: 페이지가 바뀔 때(마운트될 때) 이미 스크립트가 로드되어 있다면 강제 초기화
  useEffect(() => {
    const { naver } = window as any;
    if (naver && naver.maps) {
      initMap();
    }
  }, []);

  const keyId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;

  return (
    <main className="relative h-screen w-full bg-slate-100 overflow-hidden font-[Pretendard]">
      {/* 1. 네이버 맵 스크립트 (onLoad와 useEffect가 상호보완) */}
      <Script 
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${keyId}`} 
        onLoad={initMap}
        strategy="afterInteractive"
      />

      {/* 2. 지도 영역 (배경) */}
      <section className="absolute inset-0 z-0">
        <div id="map" className="w-full h-full grayscale-[0.2]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent pointer-events-none h-40"></div>
      </section>

      {/* 3. 상단 헤더 UI */}
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center pointer-events-none">
        <Link href="/dashboard" className="pointer-events-auto w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors">
          <i className="fa-solid fa-arrow-left text-lg"></i>
        </Link>
        <div className="pointer-events-auto bg-white/90 backdrop-blur-md px-6 py-3 rounded-[20px] shadow-xl border border-white/50 flex items-center gap-3">
          <span className="text-sm font-black text-slate-800 tracking-tighter italic">SEOUL MATE</span>
          <div className="w-[1px] h-3 bg-slate-200"></div>
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest font-[Pretendard]">Day 1</span>
        </div>
        <div className="w-12"></div>
      </div>

      {/* 4. 바텀 시트 */}
      <div 
        className={`absolute inset-x-0 bottom-0 z-30 bg-white rounded-t-[50px] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col overflow-hidden ${
          isExpanded ? 'h-[88vh]' : 'h-[38vh]'
        }`}
      >
        <div 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="w-full pt-6 pb-4 flex flex-col items-center cursor-pointer flex-shrink-0"
        >
          <div className="w-14 h-1.5 bg-slate-100 rounded-full mb-4"></div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Itinerary Details</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-36 custom-scrollbar">
          {routeData.map((item, idx) => (
            <div key={item.id} className="relative pl-12 pb-12">
              {idx !== routeData.length - 1 && (
                <div className="absolute left-[15px] top-10 w-[2px] h-full bg-slate-50 border-l-2 border-dashed border-slate-200"></div>
              )}
              <div className="absolute left-0 top-1.5 w-8 h-8 rounded-[12px] bg-white border-2 border-emerald-500 flex items-center justify-center z-10 shadow-sm">
                <span className="text-[13px] font-black text-emerald-600">{idx + 1}</span>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex gap-5 items-start">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{item.name}</h4>
                      <span className="text-xs font-black text-slate-300">{item.time}</span>
                    </div>
                    <p className="text-[14px] text-slate-400 font-semibold leading-relaxed mb-4 line-clamp-2">{item.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-black text-slate-600">
                        {item.cost}
                      </div>
                      <div className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] font-black text-emerald-700">
                        Tip: {item.tip}
                      </div>
                    </div>
                  </div>
                  <img src={item.img} className="w-24 h-24 rounded-[32px] object-cover bg-slate-100 flex-shrink-0 shadow-sm" alt="" />
                </div>
                {item.dist && (
                  <div className="flex items-center gap-3 py-3 px-5 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[24px]">
                    <i className="fa-solid fa-person-walking text-slate-300 text-xs"></i>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{item.dist} / {item.duration} 이동</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-white via-white to-transparent pt-16 z-30 pointer-events-none">
          <button className="pointer-events-auto w-full h-18 bg-slate-900 text-white rounded-[26px] font-black text-[16px] shadow-[0_15px_40px_rgba(0,0,0,0.3)] flex items-center justify-center gap-4 active:scale-[0.96] transition-all py-5">
            <i className="fa-solid fa-map-location-dot text-emerald-400 text-xl"></i>
            전체 경로 안내 시작
          </button>
        </div>
      </div>
    </main>
  );
}