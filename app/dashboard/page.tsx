'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Link 컴포넌트 추가

export default function DashboardPage() {
  const router = useRouter();

  const dayPlans = [
    { 
      day: 1, 
      date: '2026.02.10',
      distance: '12.5km',
      concept: 'Tradition & Modern',
      title: '서울의 시원한 가을',
      cost: '125,000',
      temp: '9°C',
      description: '경복궁의 정취와 광장시장의 활기, 그리고 남산의 야경을 잇는 서울의 과거와 현재를 경험하는 코스.',
      tags: ['인천공항', '명동', '남산타워', '광장시장'],
      img: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800'
    },
    { 
      day: 2, 
      date: '2026.02.11',
      distance: '8.2km',
      concept: 'Shopping & Night',
      title: '트렌디 강남 시티투어',
      cost: '240,000',
      temp: '11°C',
      description: '코엑스의 스케일과 가로수길의 트렌디한 숍들, 한강의 여유로운 밤을 즐기는 도심형 루트.',
      tags: ['코엑스', '가로수길', '한강공원', '압구정'],
      img: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=800'
    }
  ];

  return (
    <main className="min-h-screen bg-[#f1f5f9] font-[Pretendard] text-[#1A1A1A] pb-10">
      
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md flex justify-between items-center px-6 py-5 border-b border-slate-100">
        <h2 className="text-[#00966b] text-2xl font-[1000] italic tracking-tighter">SEOUL MATE</h2>
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center border border-slate-100"><i className="fa-solid fa-gear"></i></div>
          <div className="w-10 h-10 bg-[#e6f5f0] text-[#00966b] rounded-2xl flex items-center justify-center border border-[#c2e7db]"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
        </div>
      </header>

      <div className="px-5 space-y-6 mt-6">
        {dayPlans.map((plan) => (
          /* [해결책] Link 컴포넌트로 감싸서 클릭 신뢰도 100% 확보 */
          <Link href="/result" key={plan.day} className="block no-underline">
            <div className="relative h-[440px] w-full bg-white rounded-[45px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-white active:scale-[0.98] transition-all cursor-pointer group">
              
              <img src={plan.img} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" alt={plan.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />

              <div className="relative p-7 h-full flex flex-col justify-between">
                
                {/* 상단 정보 */}
                <div className="flex justify-between items-center w-full">
                  <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl flex items-center shadow-sm">
                    <span className="text-slate-600 text-[12px] font-black italic">{plan.date} | {plan.distance}</span>
                  </div>
                  <div className="bg-[#00966b] px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md">
                    <i className="fa-solid fa-cloud-sun text-white text-[10px]"></i>
                    <span className="text-[12px] font-black text-white">{plan.temp}</span>
                  </div>
                </div>

                {/* 중앙 영역 */}
                <div className="flex-1 flex flex-col justify-end pb-4">
                  <div className="bg-[#e6f5f0] w-fit px-3 py-1 rounded-lg mb-2 border border-[#00966b]/15 shadow-sm">
                    <span className="text-[#00966b] text-[13px] font-[1000] uppercase italic tracking-[0.15em]">Day 0{plan.day}</span>
                  </div>
                  <h3 className="text-[32px] font-[1000] text-slate-900 leading-tight tracking-tight italic mb-3">{plan.title}</h3>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[12px] font-[1000] text-[#00966b] uppercase italic tracking-widest leading-none">Concept: {plan.concept}</p>
                    <p className="text-[13px] font-bold text-slate-600 leading-snug max-w-[300px] line-clamp-2">{plan.description}</p>
                  </div>
                </div>

                {/* 하단 영역 */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-4 gap-1.5">
                    {plan.tags.map((tag, i) => (
                      <span key={i} className="bg-[#e6f5f0] text-[#00966b] py-2 rounded-lg text-[9px] font-black uppercase border border-[#c2e7db] text-center truncate px-1">#{tag}</span>
                    ))}
                  </div>

                  <div className="w-full bg-[#00966b] h-16 rounded-[26px] flex items-center justify-between px-8 shadow-lg shadow-green-900/10 group-active:bg-[#007a57] transition-all">
                    <div className="flex items-center gap-3 text-white"> 
                      <img src="https://flagcdn.com/w40/kr.png" alt="KR" className="w-6 h-auto rounded-sm" />
                      <span className="text-[26px] font-[1000] italic tracking-tighter leading-none">
                        <span className="text-[14px] mr-0.5 opacity-70 font-sans font-bold">₩</span>{plan.cost}
                      </span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-white text-lg"></i>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* 하단 총계 요약 */}
        <div className="bg-slate-900 rounded-[35px] p-7 flex justify-between items-center shadow-2xl relative overflow-hidden mt-2">
          <div className="relative z-10">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 block">Full Trip Summary</span>
            <h4 className="text-3xl font-[1000] italic tracking-tighter text-white leading-none"><span className="text-[#00966b] mr-1.5">₩</span>365,000</h4>
          </div>
          <button className="relative z-10 bg-[#00966b] text-white h-14 px-7 rounded-2xl font-black text-[13px] uppercase italic active:scale-95 transition-all">Download</button>
        </div>
      </div>
    </main>
  );
}