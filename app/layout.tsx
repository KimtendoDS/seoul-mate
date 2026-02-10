// app/layout.tsx
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 폰트어썸 아이콘은 여기서 한 번만 불러오는 게 가장 깔끔합니다 */}
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      {/* antialiased를 추가하면 글자가 더 매끄럽게 보입니다 */}
      <body className="antialiased">{children}</body>
    </html>
  );
}