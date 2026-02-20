// app/reco/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    naver: any;
  }
}

type Weather = {
  temperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  isRainy: boolean;
};

type Place = {
  name: string;
  category: string;
  description: string;
  address: string;
  roadAddress: string;
  link: string;
  lat: number | null;
  lng: number | null;
  distanceM: number | null;
  score: number;
  why: string[];
};

type ApiResponse = {
  success: boolean;
  context?: {
    user: { lat: number; lng: number };
    area: string;
    weather: Weather;
    congestion: string | null;
    policy: {
      keywords: string[];
      radiusM: number;
      effectiveRadiusM: number;
      option: string;
      courseSize: number;
      includePath: boolean;
    };
  };
  recommendations?: Place[];
  course?: { stops: Place[]; route: any | null; note: string };
  warnings?: string[];
  error?: string;
  debug?: any;
};

function fmtM(m: number | null) {
  if (m == null) return "—";
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

function loadNaverMaps(ncpKeyId: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));

    const ready = () => !!window.naver?.maps?.Map && !!window.naver?.maps?.Marker;

    if (ready()) return resolve();

    const id = "naver-maps-sdk";
    const existing = document.getElementById(id) as HTMLScriptElement | null;

    const waitUntilReady = () => {
      const start = Date.now();
      const timer = setInterval(() => {
        if (ready()) {
          clearInterval(timer);
          resolve();
          return;
        }
        if (Date.now() - start > 5000) {
          clearInterval(timer);
          reject(new Error("Naver Maps 초기화 실패(키/도메인/쿼터 확인)"));
        }
      }, 50);
    };

    if (existing) {
      existing.addEventListener("load", waitUntilReady);
      existing.addEventListener("error", () => reject(new Error("Failed to load Naver Maps")));
      waitUntilReady(); // 로드가 이미 끝났을 수도 있으니 즉시 체크
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.async = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(ncpKeyId)}`;
    script.onload = waitUntilReady;
    script.onerror = () => reject(new Error("Failed to load Naver Maps"));
    document.head.appendChild(script);
  });
}

export default function RecoPage() {
  // ✅ 테스트 기본값: 판교 유스페이스1(대략)
  const TEST_PANGYO = useMemo(() => ({ lat: 37.4020, lng: 127.1120 }), []);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  const [area, setArea] = useState("판교");
  const [radiusM, setRadiusM] = useState(1500);
  const [courseSize, setCourseSize] = useState(3);
  const [includePath, setIncludePath] = useState(false);

  const [latInput, setLatInput] = useState(TEST_PANGYO.lat);
  const [lngInput, setLngInput] = useState(TEST_PANGYO.lng);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // 네이버 지도 JS용 Key (ncpKeyId)
  const mapKey = useMemo(() => process.env.NEXT_PUBLIC_MAP_KEY || "", []);

  const fetchData = async () => {
    setLoading(true);
    setData(null);

    try {
      const qs = new URLSearchParams();
      qs.set("lat", String(latInput));
      qs.set("lng", String(lngInput));
      qs.set("area", area);
      qs.set("radiusM", String(radiusM));
      qs.set("courseSize", String(courseSize));
      qs.set("option", "traoptimal");
      qs.set("includePath", includePath ? "1" : "0");

      const res = await fetch(`/api/reco?${qs.toString()}`, { cache: "no-store" });
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (e: any) {
      setData({ success: false, error: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  };

  // 최초 1회 자동 호출
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 // 지도 초기화
useEffect(() => {
  if (!mapKey) {
    setMapError("NEXT_PUBLIC_MAP_KEY가 없어 지도 로드가 불가합니다.");
    return;
  }
  if (!mapDivRef.current) return;

  let cancelled = false;

  loadNaverMaps(mapKey)
    .then(() => {
      if (cancelled) return;

      setMapReady(true);
      setMapError(null);

      if (mapRef.current) return;

      mapRef.current = new window.naver.maps.Map(mapDivRef.current, {
        center: new window.naver.maps.LatLng(latInput, lngInput),
        zoom: 14,
        zoomControl: true,
      });

      const myMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(latInput, lngInput),
        map: mapRef.current,
        title: "기준 위치",
        zIndex: 999,
      });
      markersRef.current.push(myMarker);
    })
    .catch((err) => {
      setMapError(err?.message ?? "지도 로드 실패");
    });

  return () => {
    cancelled = true;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [mapKey]);

  // 기준 위치가 바뀌면 지도 중심/내 마커 갱신
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!mapReady) return;
    if (!window.naver?.maps?.Marker) return; // ✅ 핵심 가드

    // 첫번째 마커를 "기준 위치"로 유지
    const my = markersRef.current[0];
    if (my) {
      my.setPosition(new window.naver.maps.LatLng(latInput, lngInput));
    } else {
      const myMarker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(latInput, lngInput),
        map,
        title: "기준 위치",
        zIndex: 999,
      });
      markersRef.current.unshift(myMarker);
    }

    map.setCenter(new window.naver.maps.LatLng(latInput, lngInput));
  }, [latInput, lngInput]);

  // 데이터가 바뀔 때 마커/폴리라인 갱신
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 기존 마커 제거(0번 = 기준 위치 마커는 유지)
    for (const m of markersRef.current.slice(1)) {
      try {
        m.setMap(null);
      } catch {}
    }
    markersRef.current = markersRef.current.slice(0, 1);

    // 폴리라인 제거
    if (polylineRef.current) {
      try {
        polylineRef.current.setMap(null);
      } catch {}
      polylineRef.current = null;
    }

    const recs = data?.recommendations ?? [];
    const stops = data?.course?.stops ?? [];
    const stopKey = new Set(stops.map((s) => `${s.name}|${s.roadAddress || s.address}`));

    // 추천/코스 마커
    for (const p of recs) {
      if (p.lat == null || p.lng == null) continue;

      const isStop = stopKey.has(`${p.name}|${p.roadAddress || p.address}`);
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(p.lat, p.lng),
        map,
        title: p.name,
        zIndex: isStop ? 500 : 200,
      });

      // 간단 인포윈도우
      const info = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding:10px;max-width:240px;font-size:12px;line-height:1.4">
            <div style="font-weight:800;margin-bottom:4px">${p.name}</div>
            <div style="opacity:.8">${p.category || ""}</div>
            <div style="margin-top:6px;opacity:.9">거리: ${fmtM(p.distanceM)} / 점수: ${p.score}</div>
          </div>
        `,
        borderWidth: 1,
        disableAnchor: true,
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        info.open(map, marker);
      });

      markersRef.current.push(marker);
    }

    // 코스 route.path 폴리라인(있을 때만)
    const path = data?.course?.route?.path as number[][] | undefined; // [[lng,lat],...]
    if (Array.isArray(path) && path.length > 1) {
      const latLngPath = path.map(([lng, lat]) => new window.naver.maps.LatLng(lat, lng));
      polylineRef.current = new window.naver.maps.Polyline({
        map,
        path: latLngPath,
        strokeWeight: 5,
      });
    }
  }, [data]);

  const useGeolocation = () => {
    if (!navigator.geolocation) return alert("이 브라우저는 geolocation을 지원하지 않습니다.");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLatInput(Number(p.coords.latitude.toFixed(6)));
        setLngInput(Number(p.coords.longitude.toFixed(6)));
      },
      (err) => {
        alert(err?.message ?? "위치 권한/획득 실패");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const centerToPlace = (p: Place) => {
    const map = mapRef.current;
    if (!map || p.lat == null || p.lng == null) return;
    map.setCenter(new window.naver.maps.LatLng(p.lat, p.lng));
    map.setZoom(16);
  };

  const ctx = data?.context;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "420px 1fr",
        height: "100vh",
        background: "#fff",
      }}
    >
      {/* LEFT */}
      <aside
        style={{
          borderRight: "1px solid rgba(0,0,0,0.08)",
          padding: 14,
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Reco Visualizer</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              /api/reco 결과를 지도+리스트로 시각화
            </div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{loading ? "loading…" : ""}</div>
        </div>

        <section style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <label style={{ fontSize: 12, opacity: 0.7 }}>Area (입력 목표)</label>
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, opacity: 0.7 }}>Lat</label>
              <input
                type="number"
                value={latInput}
                onChange={(e) => setLatInput(Number(e.target.value))}
                style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, opacity: 0.7 }}>Lng</label>
              <input
                type="number"
                value={lngInput}
                onChange={(e) => setLngInput(Number(e.target.value))}
                style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
              />
            </div>
          </div>

          <label style={{ fontSize: 12, opacity: 0.7 }}>Radius (m)</label>
          <input
            type="number"
            value={radiusM}
            min={300}
            max={8000}
            onChange={(e) => setRadiusM(Number(e.target.value))}
            style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, opacity: 0.7 }}>Course Size</label>
              <input
                type="number"
                value={courseSize}
                min={1}
                max={5}
                onChange={(e) => setCourseSize(Number(e.target.value))}
                style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "end" }}>
              <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={includePath}
                  onChange={(e) => setIncludePath(e.target.checked)}
                />
                includePath(폴리라인)
              </label>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
            <button
              onClick={fetchData}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "white",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              조회
            </button>
            <button
              onClick={useGeolocation}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "white",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              내 위치
            </button>
          </div>

          <button
            onClick={() => {
              setArea("판교");
              setLatInput(TEST_PANGYO.lat);
              setLngInput(TEST_PANGYO.lng);
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "white",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            테스트(판교 유스페이스1)
          </button>
        </section>

        {/* Context */}
        <section style={{ marginTop: 14, padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.03)" }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Context</div>
          {ctx ? (
            <div style={{ fontSize: 13, lineHeight: 1.55 }}>
              <div>area: {ctx.area}</div>
              <div>
                weather: {ctx.weather.temperature ?? "?"}℃ / 습도 {ctx.weather.humidity ?? "?"}% / 비{" "}
                {ctx.weather.isRainy ? "O" : "X"} / 바람 {ctx.weather.windSpeed ?? "?"}
              </div>
              <div>congestion: {ctx.congestion ?? "—"}</div>
              <div>keywords: {ctx.policy.keywords.join(", ")}</div>
              <div>
                radius: {ctx.policy.radiusM}m (effective {ctx.policy.effectiveRadiusM}m)
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {data?.success === false ? "에러 상태" : "아직 데이터 없음"}
            </div>
          )}
        </section>

        {/* Map status */}
        <section style={{ marginTop: 10 }}>
          {!mapKey && (
            <div style={{ padding: 12, borderRadius: 14, background: "rgba(255,0,0,0.08)" }}>
              <div style={{ fontWeight: 900 }}>지도 키 없음</div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                .env.local에 <b>NEXT_PUBLIC_MAP_KEY</b>를 넣고 서버 재시작하세요.
              </div>
            </div>
          )}
          {mapError && (
            <div style={{ padding: 12, borderRadius: 14, background: "rgba(255,0,0,0.08)" }}>
              <div style={{ fontWeight: 900 }}>지도 로드 실패</div>
              <div style={{ fontSize: 13 }}>{mapError}</div>
            </div>
          )}
          {mapReady && !mapError && (
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>지도 로드 OK</div>
          )}
        </section>

        {/* Warnings */}
        {data?.warnings?.length ? (
          <section style={{ marginTop: 10, padding: 12, borderRadius: 14, background: "rgba(255,200,0,0.12)" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Warnings</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {data.warnings.map((w, i) => (
                <li key={i} style={{ fontSize: 13, lineHeight: 1.4 }}>
                  {w}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Course */}
        <section style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>코스</div>
          <div style={{ display: "grid", gap: 10 }}>
            {(data?.course?.stops ?? []).map((p, idx) => (
              <div
                key={`${p.name}-${idx}`}
                style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontWeight: 900 }}>
                    {idx + 1}. {p.name}
                  </div>
                  <button
                    onClick={() => centerToPlace(p)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "white",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    지도
                  </button>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{p.category}</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                  거리: {fmtM(p.distanceM)} / 점수: {p.score}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                  {p.roadAddress || p.address}
                </div>
              </div>
            ))}
            {!(data?.course?.stops?.length) && (
              <div style={{ fontSize: 13, opacity: 0.7 }}>코스가 비어있어요.</div>
            )}
          </div>
        </section>

        {/* Recommendations */}
        <section style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>추천 목록</div>
          <div style={{ display: "grid", gap: 10 }}>
            {(data?.recommendations ?? []).map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontWeight: 900 }}>{p.name}</div>
                  <button
                    onClick={() => centerToPlace(p)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "white",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    지도
                  </button>
                </div>

                <div style={{ fontSize: 12, opacity: 0.8 }}>{p.category}</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                  거리: {fmtM(p.distanceM)} / 점수: {p.score}
                </div>

                {p.why?.length ? (
                  <div style={{ fontSize: 12, marginTop: 8, opacity: 0.85, lineHeight: 1.45 }}>
                    {p.why.slice(0, 4).map((w, idx) => (
                      <div key={idx}>• {w}</div>
                    ))}
                  </div>
                ) : null}

                <div style={{ fontSize: 12, marginTop: 8, opacity: 0.75 }}>
                  {p.roadAddress || p.address}
                </div>

                {p.link ? (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, marginTop: 8, display: "inline-block" }}
                  >
                    링크 열기
                  </a>
                ) : null}
              </div>
            ))}

            {!loading && data?.success === false && (
              <div style={{ padding: 12, borderRadius: 14, background: "rgba(255,0,0,0.08)" }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>에러</div>
                <div style={{ fontSize: 13 }}>{data.error}</div>
              </div>
            )}
          </div>
        </section>
      </aside>

      {/* MAP */}
      <main style={{ position: "relative" }}>
        <div ref={mapDivRef} style={{ position: "absolute", inset: 0 }} />
        {!mapKey && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(0,0,0,0.12)",
              fontSize: 13,
            }}
          >
            NEXT_PUBLIC_MAP_KEY가 없어서 리스트만 확인 가능합니다.
          </div>
        )}
      </main>
    </div>
  );
}
