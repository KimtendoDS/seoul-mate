'use client';

import { useEffect } from 'react';

interface Props {
  isOpen: boolean;          // 모달이 열렸는지 여부
  onClose: () => void;      // 모달을 닫는 함수
  onSelect: (addr: string) => void; // 주소를 선택했을 때 실행할 함수
}

export default function AddressModal({ isOpen, onClose, onSelect }: Props) {
  
  useEffect(() => {
    // 모달이 열릴 때만 카카오 우편번호 기능을 실행합니다.
    if (isOpen) {
      const execPostcode = () => {
        new (window as any).daum.Postcode({
          oncomplete: (data: any) => {
            onSelect(data.address); // 주소 선택 시 부모에게 전달
            onClose();              // 모달 닫기
          },
          width: '100%',
          height: '100%',
        }).embed(document.getElementById('postcode-wrapper'));
      };

      // 스크립트가 로드될 시간을 살짝 줍니다.
      setTimeout(execPostcode, 100);
    }
  }, [isOpen]);

  return (
    <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      {/* 배경 어둡게 처리 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* 아래에서 위로 올라오는 하단 시트 */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ height: '70dvh' }}>
        {/* 상단 핸들러 */}
        <div className="w-full flex justify-center py-4" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>
        
        {/* 제목 영역 */}
        <div className="px-6 pb-4 flex justify-between items-center">
          <h3 className="font-black text-xl text-slate-800">숙소 주소 검색</h3>
          <button onClick={onClose} className="text-slate-400 text-2xl">×</button>
        </div>

        {/* 카카오 주소창이 들어갈 곳 */}
        <div id="postcode-wrapper" className="flex-1 w-full overflow-hidden" />
      </div>
    </div>
  );
}