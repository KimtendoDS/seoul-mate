'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import ko from '@/locales/ko.json';
import en from '@/locales/en.json';

export default function SetupPage() {
  const router = useRouter();

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const translations: any = { ko, en };
  const [langCode, setLangCode] = useState('ko');
  const [locDisplay, setLocDisplay] = useState('');
  const [budget, setBudget] = useState({ val: 0, res: 0 });
  const [meal, setMeal] = useState({ val: 0, res: 0 });
  const [rating, setRating] = useState(4.0);
  const [favFoods, setFavFoods] = useState<{name: string, icon: string}[]>([]);
  const [hateFoods, setHateFoods] = useState<{name: string, icon: string}[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isAddrOpen, setIsAddrOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
    if (list.find(f => f.name === food.name)) {
      setList(list.filter(f => f.name !== food.name));
    } else {
      setList([...list, food]);
    }
  };

  const openPostcode = () => { setIsAddrOpen(true); };

  useEffect(() => {
    if (isAddrOpen) {
      const container = document.getElementById('kakao-layer');
      if (container && (window as any).daum) {
        new (window as any).daum.Postcode({
          oncomplete: (data: any) => {
            setLocDisplay(data.address);
            setIsAddrOpen(false);
          },
          width: '100%',
          height: '100%'
        }).embed(container);
      }
    }
  }, [isAddrOpen]);

  const handleGenerate = () => { router.push('/dashboard'); };

  if (!mounted) return <div className="min-h-screen bg-[#f1f5f9]" />;

  return (
    <main className="fixed inset-0 bg-[#f1f5f9] flex justify-center items-center p-3 sm:p-6 font-[Pretendard] overflow-hidden">
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/css/flag-icons.min.css" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="w-full max-w-[600px] bg-white rounded-[40px] shadow-2xl flex flex-col max-h-[94dvh] overflow-hidden relative">
        <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-14 sm:py-12 scrollbar-hide">
          
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-[#00966b] text-2xl sm:text-3xl font-black italic tracking-tighter">{t.title}</h2>
            <div className="relative">
              <button onClick={() => setOpenDropdown(openDropdown === 'lang' ? null : 'lang')} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100">
                <span className={`fi fi-${langOptions.find(l => l.code === langCode)?.flag}`}></span>
                <span className="text-[10px] font-bold text-slate-700">{langOptions.find(l => l.code === langCode)?.name}</span>
                <i className={`fa-solid fa-chevron-down text-[8px] text-slate-400 ${openDropdown === 'lang' ? 'rotate-180' : ''}`}></i>
              </button>
              {openDropdown === 'lang' && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-100 rounded-2xl shadow-xl z-[60] py-1 overflow-hidden">
                  {langOptions.map(l => (
                    <div key={l.code} onClick={() => { setLangCode(l.code); setOpenDropdown(null); }} className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-[#f0f9f6] hover:text-[#00966b] cursor-pointer flex items-center gap-2">
                      <span className={`fi fi-${l.flag}`}></span> {l.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-8 text-left">
            <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-widest">{t.stay}</label>
            <div className="flex gap-3 h-14">
              <input type="text" value={locDisplay} readOnly placeholder={t.placeholder_stay} className="flex-1 px-5 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm outline-none" />
              <button onClick={openPostcode} className="w-14 bg-[#e6f5f0] text-[#00966b] rounded-2xl flex items-center justify-center text-xl flex-shrink-0 active:scale-95 transition-transform">
                <i className="fa-solid fa-location-dot"></i>
              </button>
            </div>
          </div>

          <div className="mb-8 text-left">
            <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-widest">{t.period}</label>
            <DatePicker
              selectsRange startDate={startDate} endDate={endDate}
              onChange={(update: any) => { setStartDate(update[0]); setEndDate(update[1]); }}
              withPortal
              customInput={
                <div className="w-full h-14 rounded-2xl bg-slate-50 flex items-center justify-between px-5 cursor-pointer border-2 border-transparent">
                  <span className="text-sm font-bold text-slate-700">{startDate.toLocaleDateString()} - {endDate?.toLocaleDateString()}</span>
                  <i className="fa-regular fa-calendar text-slate-400"></i>
                </div>
              }
            />
          </div>

          {/* 💰 [수정 포인트] 예산/식비 섹션: 한 줄에 배치 & 너비 50:50 */}
          {[ 
            { label: t.budget, state: budget, setState: setBudget, curr: budCurr, setCurr: setBudCurr, id: 'bud' },
            { label: t.meal, state: meal, setState: setMeal, curr: mealCurr, setCurr: setMealCurr, id: 'meal' }
          ].map((item) => (
            <div key={item.id} className="mb-8 text-left relative">
              <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-widest">{item.label}</label>
              
              <div className="flex items-center gap-2 h-14 w-full">
                {/* 1. 셀렉트 (고정 너비) */}
                <div 
                  onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)} 
                  className="flex items-center justify-center gap-1.5 px-2 bg-slate-50 rounded-2xl cursor-pointer min-w-[75px] sm:min-w-[90px] h-full border-2 border-transparent"
                >
                  <span className={`fi fi-${item.curr.flag} text-xs`}></span>
                  <span className="text-[10px] font-black">{item.curr.code}</span>
                </div>

                {/* 2. 입력창 & 3. 결과창 (정확히 50:50 분할) */}
                <div className="flex flex-1 gap-2 h-full min-w-0">
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-1/2 px-3 rounded-2xl bg-slate-50 font-bold text-[13px] text-right outline-none focus:bg-white focus:border-[#00966b]/20 border-2 border-transparent transition-all"
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      item.setState({ val: v, res: calcWon(v, item.curr.rate) });
                    }} 
                  />
                  <div className="w-1/2 px-3 rounded-2xl bg-[#f0f9f6] flex items-center justify-end text-[#00966b] font-black text-[11px] overflow-hidden">
                    <span className="truncate">{item.state.res.toLocaleString()} ₩</span>
                  </div>
                </div>
              </div>

              {openDropdown === item.id && (
                <div className="absolute top-[85px] left-0 w-32 bg-white border border-slate-100 rounded-2xl shadow-xl z-[60] py-1">
                  {currencyOptions.map(c => (
                    <div key={c.code} onClick={() => { item.setCurr(c); setOpenDropdown(null); }} className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-[#f0f9f6] cursor-pointer flex items-center gap-2">
                      <span className={`fi fi-${c.flag}`}></span> {c.code}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="mb-8 relative text-left">
            <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-widest">{t.fav}</label>
            <div onClick={() => setOpenDropdown(openDropdown === 'fav' ? null : 'fav')} className="w-full min-h-[56px] px-5 py-2 rounded-2xl border-2 border-slate-50 bg-slate-50 flex items-center justify-between cursor-pointer">
              <div className="flex flex-wrap gap-1.5">
                {favFoods.length > 0 ? favFoods.map(f => (
                  <span key={f.name} className="px-2 py-1 bg-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm border border-[#00966b]/10">
                    {f.icon} {f.name}
                  </span>
                )) : <span className="text-xs text-slate-400 font-bold">{t.placeholder_food}</span>}
              </div>
              <i className="fa-solid fa-chevron-down text-[10px] text-slate-300 ml-2"></i>
            </div>
            {openDropdown === 'fav' && (
              <div className="absolute top-[85px] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-[60] grid grid-cols-3 gap-1 p-2">
                {foodOptions.map(food => (
                  <div key={food.name} onClick={() => toggleFood('fav', food)} className={`p-3 rounded-xl text-center cursor-pointer transition-all ${favFoods.find(f => f.name === food.name) ? 'bg-[#f0f9f6] text-[#00966b]' : 'hover:bg-slate-50'}`}>
                    <div className="text-xl mb-1">{food.icon}</div>
                    <div className="text-[10px] font-bold">{food.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-8 relative text-left">
            <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-widest">{t.hate}</label>
            <div onClick={() => setOpenDropdown(openDropdown === 'hate' ? null : 'hate')} className="w-full min-h-[56px] px-5 py-2 rounded-2xl border-2 border-slate-50 bg-slate-50 flex items-center justify-between cursor-pointer">
              <div className="flex flex-wrap gap-1.5">
                {hateFoods.length > 0 ? hateFoods.map(f => (
                  <span key={f.name} className="px-2 py-1 bg-red-50 text-red-500 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm border border-red-100">
                    {f.icon} {f.name}
                  </span>
                )) : <span className="text-xs text-slate-400 font-bold">{t.placeholder_food}</span>}
              </div>
              <i className="fa-solid fa-chevron-down text-[10px] text-slate-300 ml-2"></i>
            </div>
            {openDropdown === 'hate' && (
              <div className="absolute top-[85px] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-[60] grid grid-cols-3 gap-1 p-2">
                {foodOptions.map(food => (
                  <div key={food.name} onClick={() => toggleFood('hate', food)} className={`p-3 rounded-xl text-center cursor-pointer transition-all ${hateFoods.find(f => f.name === food.name) ? 'bg-red-50 text-red-500' : 'hover:bg-slate-50'}`}>
                    <div className="text-xl mb-1">{food.icon}</div>
                    <div className="text-[10px] font-bold">{food.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-2 text-left">
            <label className="text-[11px] font-black text-slate-400 uppercase mb-3 block tracking-widest">{t.rating}</label>
            <div className="flex gap-1 h-14">
              {[1, 2, 3, 4, 5].map((num) => (
                <button key={num} onClick={() => setRating(num)} className={`flex-1 rounded-2xl border-2 font-black text-[11px] flex items-center justify-center gap-1 transition-all ${rating === num ? 'bg-[#00966b] border-[#00966b] text-white shadow-md' : 'bg-white border-slate-50 text-slate-300'}`}>
                  <i className="fa-solid fa-star text-[8px]"></i>{num.toFixed(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 border-t border-slate-50 bg-white">
          <button onClick={handleGenerate} className="w-full h-16 bg-[#00966b] text-white rounded-[25px] font-black text-lg shadow-xl active:scale-95 transition-all">
            {t.generate}
            <i className="fa-solid fa-robot text-2xl"></i>
          </button>
        </div>

        {isAddrOpen && (
          <div className="absolute inset-0 z-[100] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={() => setIsAddrOpen(false)}></div>
            <div className="relative bg-white rounded-t-[30px] shadow-2xl flex flex-col" style={{ height: '60%' }}>
              <div className="w-full flex justify-center py-4 border-b"><div className="w-12 h-1.5 bg-slate-200 rounded-full"></div></div>
              <div id="kakao-layer" className="flex-1 w-full overflow-hidden"></div>
              <button onClick={() => setIsAddrOpen(false)} className="w-full py-4 bg-slate-50 text-slate-500 font-bold text-sm">닫기</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}