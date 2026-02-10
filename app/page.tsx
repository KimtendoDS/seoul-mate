'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';

// 1. JSON 파일 임포트 (파일이 실제로 해당 경로에 있어야 합니다)
// 만약 에러가 나면 public 폴더 등에 넣고 fetch로 가져오는 방식이 안전하지만, 
// 일단 기존 로직대로 임포트합니다.
import ko from '@/locales/ko.json';
import en from '@/locales/en.json';

export default function SetupPage() {
  const router = useRouter();
  
  // Hydration 에러 방지용 mounted 상태
  const [mounted, setMounted] = useState(false);
  
  // 다국어 매핑
  const translations: any = { ko, en };
  
  // 상태 관리
  const [langCode, setLangCode] = useState('ko');
  const [locDisplay, setLocDisplay] = useState('');
  const [budget, setBudget] = useState({ val: 0, res: 0 });
  const [meal, setMeal] = useState({ val: 0, res: 0 });
  const [rating, setRating] = useState(4.0);
  const [favFoods, setFavFoods] = useState<{name: string, icon: string}[]>([]);
  const [hateFoods, setHateFoods] = useState<{name: string, icon: string}[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // 마운트 체크
  useEffect(() => {
    setMounted(true);
  }, []);

  // 현재 언어 데이터 선택 (데이터가 없을 경우를 대비해 방어 로직 추가)
  const t = translations[langCode] || ko;

  const langOptions = [
    { code: 'ko', name: '한국어', flag: 'kr' },
    { code: 'en', name: 'English', flag: 'us' }
  ];

  const currencyOptions = [
    { code: 'USD', flag: 'us', rate: 1350 },
    { code: 'JPY', flag: 'jp', rate: 9 },
    { code: 'EUR', flag: 'eu', rate: 1450 },
    { code: 'CNY', flag: 'cn', rate: 185 }
  ];

  const [budCurr, setBudCurr] = useState(currencyOptions[0]);
  const [mealCurr, setMealCurr] = useState(currencyOptions[0]);

  const foodOptions = [
    { name: '스시', icon: '🍣' }, { name: '피자', icon: '🍕' },
    { name: '버거', icon: '🍔' }, { name: '라멘', icon: '🍜' },
    { name: '치킨', icon: '🍗' }, { name: '삼겹살', icon: '🥓' }
  ];

  const calcWon = (val: number, rate: number) => Math.floor(val * rate);

  const toggleFood = (type: 'fav' | 'hate', food: {name: string, icon: string}) => {
    const list = type === 'fav' ? favFoods : hateFoods;
    const setList = type === 'fav' ? setFavFoods : setHateFoods;
    if (!list.find(f => f.name === food.name)) {
      setList([...list, food]);
    }
    setOpenDropdown(null);
  };

  const handleGenerate = () => {
    router.push('/dashboard');
  };

  // 마운트 전에는 아무것도 렌더링하지 않음 (Hydration 에러 해결)
  if (!mounted) return <div className="min-h-screen bg-[#f1f5f9]" />;

  return (
    <main className="min-h-screen bg-[#f1f5f9] flex justify-center items-center p-6 font-[Pretendard]">
      {/* 외부 리소스 로드 */}
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/css/flag-icons.min.css" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="w-full max-w-[680px] bg-white p-14 rounded-[50px] shadow-2xl">
        
        {/* 헤더: 로고 & 다국어 전환 */}
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-[#00966b] text-3xl font-black italic tracking-tighter">
            {t.title}
          </h2>
          
          <div className="relative">
            <button 
              onClick={() => setOpenDropdown(openDropdown === 'lang' ? null : 'lang')}
              className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100"
            >
              <span className={`fi fi-${langOptions.find(l => l.code === langCode)?.flag}`}></span>
              <span className="text-xs font-bold text-slate-700">{langOptions.find(l => l.code === langCode)?.name}</span>
              <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform ${openDropdown === 'lang' ? 'rotate-180' : ''}`}></i>
            </button>
            {openDropdown === 'lang' && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-1 overflow-hidden">
                {langOptions.map(l => (
                  <div key={l.code} onClick={() => { setLangCode(l.code); setOpenDropdown(null); }} className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-[#f0f9f6] hover:text-[#00966b] cursor-pointer flex items-center gap-2">
                    <span className={`fi fi-${l.flag}`}></span> {l.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 1. 위치 */}
        <div className="mb-10 text-left">
          <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-widest">{t.stay}</label>
          <div className="flex gap-3 h-14">
            <input type="text" value={locDisplay} readOnly placeholder={t.placeholder_stay} className="flex-1 px-6 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm outline-none" />
            <button className="w-14 bg-[#e6f5f0] text-[#00966b] rounded-2xl flex items-center justify-center text-xl hover:bg-[#00966b] hover:text-white transition-all"><i className="fa-solid fa-location-dot"></i></button>
          </div>
        </div>

        {/* 2. 기간 */}
        <div className="mb-10 text-left">
          <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-widest">{t.period}</label>
          <div className="flex items-center gap-3 h-14">
            <input type="date" className="flex-1 px-5 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm outline-none" />
            <div className="w-4 h-0.5 bg-slate-200"></div>
            <input type="date" className="flex-1 px-5 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm outline-none" />
          </div>
        </div>

        {/* 3 & 4. 예산/식비 */}
        {[ 
          { label: t.budget, state: budget, setState: setBudget, curr: budCurr, setCurr: setBudCurr, id: 'bud' },
          { label: t.meal, state: meal, setState: setMeal, curr: mealCurr, setCurr: setMealCurr, id: 'meal' }
        ].map((item) => (
          <div key={item.id} className="mb-10 text-left">
            <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-widest">{item.label}</label>
            <div className="flex gap-3 h-14 relative">
              <div onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)} className="flex items-center gap-2 px-4 bg-slate-50 border-2 border-slate-50 rounded-2xl cursor-pointer min-w-[100px]">
                <span className={`fi fi-${item.curr.flag}`}></span>
                <span className="text-xs font-black text-slate-600">{item.curr.code}</span>
              </div>
              {openDropdown === item.id && (
                <div className="absolute top-16 left-0 w-[120px] bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-1 overflow-hidden">
                  {currencyOptions.map(c => (
                    <div key={c.code} onClick={() => { item.setCurr(c); setOpenDropdown(null); }} className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-[#f0f9f6] hover:text-[#00966b] cursor-pointer flex items-center gap-2">
                      <span className={`fi fi-${c.flag}`}></span> {c.code}
                    </div>
                  ))}
                </div>
              )}
              <input type="number" placeholder="0" className="flex-1 px-5 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm text-right outline-none focus:border-[#00966b] focus:bg-white" 
                onChange={(e) => {
                  const v = Number(e.target.value);
                  item.setState({ val: v, res: calcWon(v, item.curr.rate) });
                }} 
              />
              <div className="flex-1 px-5 rounded-2xl bg-[#f0f9f6] flex items-center justify-end text-[#00966b] font-black text-sm">
                {item.state.res.toLocaleString()} ₩
              </div>
            </div>
          </div>
        ))}

        {/* 5. 좋아하는 음식 */}
        <div className="mb-10 relative text-left">
          <label className="text-[11px] font-black text-slate-400 uppercase mb-2 block tracking-widest">{t.fav}</label>
          {favFoods.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-1">
              {favFoods.map(f => (
                <span key={f.name} className="px-4 py-2 bg-[#e6f5f0] text-[#00966b] rounded-full text-[12px] font-black flex items-center gap-2 border border-[#c2e7db]">
                  {f.icon} {f.name} <button onClick={() => setFavFoods(favFoods.filter(i => i.name !== f.name))} className="ml-1 opacity-50 hover:opacity-100">✕</button>
                </span>
              ))}
            </div>
          )}
          <div onClick={() => setOpenDropdown(openDropdown === 'fav' ? null : 'fav')} className={`w-full h-14 px-6 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${openDropdown === 'fav' ? 'border-[#00966b] bg-white' : 'border-slate-50 bg-slate-50'}`}>
            <span className="text-sm font-bold text-slate-400">{t.placeholder_food}</span>
            <i className={`fa-solid fa-chevron-down text-xs transition-transform ${openDropdown === 'fav' ? 'rotate-180 text-[#00966b]' : 'text-slate-300'}`}></i>
          </div>
          {openDropdown === 'fav' && (
            <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl z-[60] p-3">
              <div className="grid grid-cols-2 gap-2">
                {foodOptions.map(f => (
                  <div key={f.name} onClick={() => toggleFood('fav', f)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[#f0f9f6] hover:text-[#00966b] cursor-pointer group">
                    <span className="text-xl group-hover:scale-125 transition-transform">{f.icon}</span>
                    <span className="text-xs font-black">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6. 싫어하는 음식 */}
        <div className="mb-10 relative text-left">
          <label className="text-[11px] font-black text-slate-400 uppercase mb-2 block tracking-widest">{t.hate}</label>
          {hateFoods.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-1">
              {hateFoods.map(f => (
                <span key={f.name} className="px-4 py-2 bg-red-50 text-red-500 rounded-full text-[12px] font-black flex items-center gap-2 border border-red-100">
                  {f.icon} {f.name} <button onClick={() => setHateFoods(hateFoods.filter(i => i.name !== f.name))} className="ml-1 opacity-50 hover:opacity-100">✕</button>
                </span>
              ))}
            </div>
          )}
          <div onClick={() => setOpenDropdown(openDropdown === 'hate' ? null : 'hate')} className={`w-full h-14 px-6 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${openDropdown === 'hate' ? 'border-red-400 bg-white' : 'border-slate-50 bg-slate-50'}`}>
            <span className="text-sm font-bold text-slate-400">{t.placeholder_food}</span>
            <i className={`fa-solid fa-chevron-down text-xs transition-transform ${openDropdown === 'hate' ? 'rotate-180 text-red-400' : 'text-slate-300'}`}></i>
          </div>
          {openDropdown === 'hate' && (
            <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl z-[60] p-3">
              <div className="grid grid-cols-2 gap-2">
                {foodOptions.map(f => (
                  <div key={f.name} onClick={() => toggleFood('hate', f)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 hover:text-red-500 cursor-pointer group">
                    <span className="text-xl group-hover:scale-125 transition-transform">{f.icon}</span>
                    <span className="text-xs font-black">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 7. 별점 */}
        <div className="mb-14 text-left">
          <label className="text-[11px] font-black text-slate-400 uppercase mb-4 block tracking-widest">{t.rating}</label>
          <div className="flex gap-3 h-14">
            {[1.0, 2.0, 3.0, 4.0, 5.0].map((num) => (
              <button key={num} onClick={() => setRating(num)} className={`flex-1 rounded-[20px] border-2 font-black text-xs transition-all flex items-center justify-center gap-1 ${rating === num ? 'bg-[#00966b] border-[#00966b] text-white shadow-lg' : 'bg-white border-slate-50 text-slate-300'}`}>
                <i className="fa-solid fa-star text-[9px]"></i> {num.toFixed(1)}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          className="w-full h-20 bg-[#00966b] text-white rounded-[30px] font-black text-xl shadow-xl shadow-green-900/20 active:scale-[0.98] transition-all"
        >
          {t.generate}
        </button>
      </div>
    </main>
  );
}