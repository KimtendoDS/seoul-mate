// app/api/reco/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Weather = {
  temperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  isRainy: boolean;
  source: "data.go.kr" | "open-meteo" | "none";
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

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function toInt(v: string | null, def: number) {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : def;
}
function toFloat(v: string | null, def: number) {
  const n = Number.parseFloat(v ?? "");
  return Number.isFinite(n) ? n : def;
}
function stripHtml(s: string) {
  return (s ?? "").replace(/<[^>]*>/g, "").trim();
}
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function bucketOf(p: Place): "cafe" | "food" | "culture" | "outdoor" | "other" {
  const c = (p.category || "").toLowerCase();
  const n = (p.name || "").toLowerCase();
  const addr = (p.roadAddress || p.address || "").toLowerCase();

  const has = (kw: string) => c.includes(kw) || n.includes(kw) || addr.includes(kw);

  if (has("카페") || has("디저트") || has("coffee") || has("cafe")) return "cafe";
  if (
    has("한식") || has("일식") || has("중식") || has("양식") || has("분식") ||
    has("치킨") || has("피자") || has("고기") || has("술집") ||
    has("음식점") || has("restaurant")
  ) return "food";
  if (has("전시") || has("박물관") || has("미술관") || has("문화") || has("공연") || has("갤러리")) return "culture";
  if (has("공원") || has("산책") || has("서울숲") || has("한강") || has("숲") || has("walk")) return "outdoor";
  return "other";
}

function congestionIndex(level: string | null | undefined) {
  const s = (level || "").trim();
  if (!s) return 0.5;
  if (s.includes("여유")) return 0.15;
  if (s.includes("보통")) return 0.45;
  if (s.includes("약간")) return 0.65;
  if (s.includes("붐빔") && !s.includes("매우")) return 0.85;
  if (s.includes("매우")) return 1.0;
  return 0.5;
}

/** data.go.kr 서비스키는 이미 %2B 같은 인코딩이 들어있는 경우가 많아서 "추가 인코딩"을 피함 */
function buildServiceKeyParam(serviceKey: string) {
  // 이미 인코딩된 키(대부분)면 그대로 붙이기
  if (serviceKey.includes("%")) return `serviceKey=${serviceKey}`;
  // 인코딩 안된 키면 인코딩해서 붙이기
  return `serviceKey=${encodeURIComponent(serviceKey)}`;
}

/** KST 기준 YYYYMMDD / HH00 만들기 */
function kstBaseDateTime() {
  // KST = UTC+9 → getUTC* 로 KST 파츠 뽑기
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  let y = kst.getUTCFullYear();
  let m = kst.getUTCMonth() + 1;
  let d = kst.getUTCDate();
  let hh = kst.getUTCHours();
  const mm = kst.getUTCMinutes();

  // 실황 업데이트 지연 대비: 45분 이전이면 1시간 전 데이터로 시도
  if (mm < 45) hh -= 1;

  // 날짜 롤백 처리
  if (hh < 0) {
    const prev = new Date(Date.now() + 9 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
    y = prev.getUTCFullYear();
    m = prev.getUTCMonth() + 1;
    d = prev.getUTCDate();
    hh = 23;
  }

  const base_date = `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`;
  const base_time = `${String(hh).padStart(2, "0")}00`;
  return { base_date, base_time };
}

/**
 * 기상청 격자 변환 (DFS)
 * - 위경도 → nx, ny
 */
function latLngToGrid(lat: number, lng: number) {
  const RE = 6371.00877; // km
  const GRID = 5.0; // km
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;

  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;

  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);

  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const x = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const y = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx: x, ny: y };
}

async function fetchKmaWeather(lat: number, lng: number, serviceKey: string): Promise<Weather> {
  const { nx, ny } = latLngToGrid(lat, lng);
  const { base_date, base_time } = kstBaseDateTime();

  const base = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";
  const qs =
    `${buildServiceKeyParam(serviceKey)}` +
    `&pageNo=1&numOfRows=1000&dataType=JSON` +
    `&base_date=${base_date}&base_time=${base_time}` +
    `&nx=${nx}&ny=${ny}`;

  const url = `${base}?${qs}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return {
      temperature: null,
      humidity: null,
      precipitation: null,
      weatherCode: null,
      windSpeed: null,
      isRainy: false,
      source: "none",
    };
  }

  const j = await res.json().catch(() => null);
  const items: any[] = j?.response?.body?.items?.item ?? [];

  // getUltraSrtNcst는 보통 RN1/T1H/WSD 중심 (REH/PTY/SKY가 없을 수 있음)
  let T1H: number | null = null;
  let REH: number | null = null;
  let RN1: number | null = null;
  let WSD: number | null = null;
  let PTY: number | null = null;
  let SKY: number | null = null;

  for (const it of items) {
    const cat = String(it?.category ?? "");
    const vRaw = it?.obsrValue ?? it?.fcstValue ?? null;
    const v = typeof vRaw === "string" ? Number(vRaw) : (typeof vRaw === "number" ? vRaw : null);

    if (!Number.isFinite(v as number)) continue;

    if (cat === "T1H") T1H = v as number;
    if (cat === "REH") REH = v as number;
    if (cat === "RN1") RN1 = v as number;
    if (cat === "WSD") WSD = v as number;
    if (cat === "PTY") PTY = v as number;
    if (cat === "SKY") SKY = v as number;
  }

  const precipitation = RN1;
  const isRainy = ((precipitation ?? 0) > 0) || ((PTY ?? 0) > 0);

  return {
    temperature: T1H,
    humidity: REH,
    precipitation,
    // weatherCode는 데이터 형태가 제각각이라 일단 null 유지(원하면 SKY/PTY 조합으로 매핑해줄 수 있음)
    weatherCode: SKY ?? PTY ?? null,
    windSpeed: WSD,
    isRainy,
    source: "data.go.kr",
  };
}

async function fetchOpenMeteoWeather(lat: number, lng: number): Promise<Weather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return {
      temperature: null,
      humidity: null,
      precipitation: null,
      weatherCode: null,
      windSpeed: null,
      isRainy: false,
      source: "none",
    };
  }
  const j = await res.json();
  const cur = j?.current ?? {};
  const precipitation = typeof cur?.precipitation === "number" ? cur.precipitation : null;
  return {
    temperature: typeof cur?.temperature_2m === "number" ? cur.temperature_2m : null,
    humidity: typeof cur?.relative_humidity_2m === "number" ? cur.relative_humidity_2m : null,
    precipitation,
    weatherCode: typeof cur?.weather_code === "number" ? cur.weather_code : null,
    windSpeed: typeof cur?.wind_speed_10m === "number" ? cur.wind_speed_10m : null,
    isRainy: (precipitation ?? 0) > 0,
    source: "open-meteo",
  };
}

async function fetchWeather(lat: number, lng: number): Promise<Weather> {
  const key = process.env.DATA_GO_KR_WEATHER_KEY;
  if (key) return fetchKmaWeather(lat, lng, key);
  return fetchOpenMeteoWeather(lat, lng);
}

async function fetchSeoulCongestion(area: string, seoulKey?: string) {
  if (!seoulKey) return { level: null as string | null, raw: null as any };
  const url = `http://openapi.seoul.go.kr:8088/${seoulKey}/json/citydata/1/1/${encodeURIComponent(area)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { level: null, raw: null };
  const j = await res.json();
  const city = j?.CITYDATA ?? {};
  const lvl = city?.AREA_CONGEST_LVL ?? null;
  return { level: typeof lvl === "string" ? lvl : null, raw: city };
}

async function naverLocalSearch(
  query: string,
  display: number,
  sort: "random" | "comment",
  naverId: string,
  naverSecret: string
) {
  const url =
    `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}` +
    `&display=${display}&start=1&sort=${sort}`;
  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": naverId,
      "X-Naver-Client-Secret": naverSecret,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Naver local search failed (${res.status}): ${t.slice(0, 400)}`);
  }
  return res.json();
}

function convertMapXYToLatLng(mapx: string, mapy: string) {
  // 네이버 지역검색: mapx=경도, mapy=위도 (정수 * 1e7)
  const x = Number(mapx);
  const y = Number(mapy);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { lat: null, lng: null };
  return { lng: x / 1e7, lat: y / 1e7 };
}

function nearestNeighborOrder(startLat: number, startLng: number, pts: Place[]): Place[] {
  const left = [...pts].filter(p => p.lat != null && p.lng != null);
  const ordered: Place[] = [];
  let curLat = startLat;
  let curLng = startLng;

  while (left.length > 0) {
    let bestIdx = 0;
    let bestD = Number.POSITIVE_INFINITY;
    for (let i = 0; i < left.length; i++) {
      const p = left[i];
      const d = haversineM(curLat, curLng, p.lat!, p.lng!);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    const chosen = left.splice(bestIdx, 1)[0];
    ordered.push(chosen);
    curLat = chosen.lat!;
    curLng = chosen.lng!;
  }
  return ordered;
}

export async function GET(req: NextRequest) {
  const NAVER_ID = process.env.NAVER_SEARCH_CLIENT_ID;
  const NAVER_SECRET = process.env.NAVER_SEARCH_CLIENT_SECRET;
  const SEOUL_KEY = process.env.SEOUL_DATA_KEY;

  if (!NAVER_ID || !NAVER_SECRET) {
    return NextResponse.json({
      success: false,
      error: "NAVER_SEARCH_CLIENT_ID / NAVER_SEARCH_CLIENT_SECRET 가 필요합니다.",
    });
  }

  const sp = req.nextUrl.searchParams;

  // ✅ 판교 유스페이스1 기본값
  const lat = toFloat(sp.get("lat"), 37.4003183);
  const lng = toFloat(sp.get("lng"), 127.1066904);
  const area = (sp.get("area") || "판교").trim();

  const radiusM = clamp(toInt(sp.get("radiusM"), 1500), 300, 8000);
  const courseSize = clamp(toInt(sp.get("courseSize"), 3), 1, 5);

  const keywordsParam = sp.get("keywords");

  const weather = await fetchWeather(lat, lng);

  const defaultKeywords = weather.isRainy
    ? ["파전", "막걸리", "카페", "전시"]
    : ["맛집", "카페", "전시", "산책"];

  const keywords = (keywordsParam ? keywordsParam.split(",") : defaultKeywords)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  const { level: congestLevel } = await fetchSeoulCongestion(area, SEOUL_KEY);
  const cIdx = congestionIndex(congestLevel);
  const effectiveRadius = radiusM * (1 - 0.35 * cIdx);

  const warnings: string[] = [];

  // 1) 후보 수집 (네이버 지역검색은 display 최대 5)
  const rawLists = await Promise.all(
    keywords.map(async (kw) => {
      const q = `${area} ${kw}`;
      const j = await naverLocalSearch(q, 5, "comment", NAVER_ID, NAVER_SECRET);
      const items = Array.isArray(j?.items) ? j.items : [];
      return { kw, items };
    })
  );

  const dedup = new Map<string, Place>();

  for (const pack of rawLists) {
    for (const it of pack.items) {
      const name = stripHtml(it?.title ?? "");
      if (!name) continue;

      const category = String(it?.category ?? "");
      const address = String(it?.address ?? "");
      const roadAddress = String(it?.roadAddress ?? "");
      const link = String(it?.link ?? "");
      const desc = stripHtml(it?.description ?? "");

      const { lat: plat, lng: plng } = convertMapXYToLatLng(String(it?.mapx ?? ""), String(it?.mapy ?? ""));

      const key = `${name}|${roadAddress || address}`;

      const distanceM =
        plat != null && plng != null ? Math.round(haversineM(lat, lng, plat, plng)) : null;

      const why: string[] = [];
      let score = 0;

      // 거리 점수
      if (distanceM == null) {
        why.push("거리 계산 불가(좌표 없음)");
      } else {
        const distFactor = clamp(1 - distanceM / Math.max(300, effectiveRadius), -1, 1);
        score += distFactor * 60;
        if (distanceM <= effectiveRadius) why.push(`반경 적합(${distanceM}m)`);
        else why.push(`반경 외(>${Math.round(effectiveRadius)}m)`);
      }

      // 날씨 가중치
      const b = bucketOf({
        name,
        category,
        description: desc,
        address,
        roadAddress,
        link,
        lat: plat,
        lng: plng,
        distanceM,
        score: 0,
        why: [],
      });

      if (weather.isRainy) {
        if (b === "cafe" || b === "food" || b === "culture") {
          score += 18;
          why.push("우천: 실내 성향 가산");
        }
        if (b === "outdoor") {
          score -= 12;
          why.push("우천: 야외 성향 감점");
        }
      } else {
        if (b === "outdoor") {
          score += 14;
          why.push("맑음: 야외 성향 가산");
        }
      }

      // 혼잡도 반영(붐빌수록 가까운 곳 선호)
      if (distanceM != null) {
        score += clamp((effectiveRadius - distanceM) / effectiveRadius, -1, 1) * (10 * cIdx);
      }
      if (congestLevel) why.push(`혼잡도(${congestLevel}) 반영`);

      // 리뷰정렬 기반 보정
      score += 6;
      why.push("리뷰 기반 정렬 후보(sort=comment)");

      const place: Place = {
        name,
        category,
        description: desc,
        address,
        roadAddress,
        link,
        lat: plat,
        lng: plng,
        distanceM,
        score: Math.round(score),
        why,
      };

      const prev = dedup.get(key);
      if (!prev || prev.score < place.score) dedup.set(key, place);
    }
  }

  const candidates = [...dedup.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  // 2) 코스 자동 구성(다양성 + 너무 붙어있는 곳 회피)
  const picked: Place[] = [];
  const minSepM = 180;

  const preferredBuckets = weather.isRainy
    ? (["food", "cafe", "culture", "food", "cafe"] as const)
    : (["outdoor", "cafe", "food", "culture", "cafe"] as const);

  const pickNext = (bucket?: ReturnType<typeof bucketOf>) => {
    const list = bucket ? candidates.filter(p => bucketOf(p) === bucket) : candidates;

    for (const p of list) {
      if (picked.find(x => x.name === p.name && (x.roadAddress || x.address) === (p.roadAddress || p.address))) continue;
      if (p.lat == null || p.lng == null) continue;

      let ok = true;
      for (const q of picked) {
        if (q.lat == null || q.lng == null) continue;
        const d = haversineM(p.lat, p.lng, q.lat, q.lng);
        if (d < minSepM) { ok = false; break; }
      }
      if (!ok) continue;

      picked.push(p);
      return true;
    }
    return false;
  };

  for (let i = 0; i < courseSize; i++) {
    const targetBucket = preferredBuckets[i] ?? "other";
    if (!pickNext(targetBucket)) {
      if (!pickNext()) break;
    }
  }
  while (picked.length < courseSize) {
    if (!pickNext()) break;
  }

  // 3) 방문 순서(Nearest Neighbor)
  const ordered = nearestNeighborOrder(lat, lng, picked);

  return NextResponse.json({
    success: true,
    context: {
      user: { lat, lng },
      area,
      weather,
      congestion: congestLevel,
      policy: {
        keywords,
        radiusM,
        effectiveRadiusM: Math.round(effectiveRadius),
        courseSize,
      },
    },
    recommendations: candidates.slice(0, 10),
    course: {
      stops: ordered,
      route: null, // ✅ 지금은 표시용이라 경로는 비움 (원하면 다음 단계에서 Directions 붙이면 됨)
      note: "현재는 코스/마커 시각화용입니다. 경유지 포함 길찾기(polyline)가 필요하면 NCP Directions를 추가로 붙이면 됩니다.",
    },
    warnings,
    debug: {
      candidateCount: dedup.size,
      rankedCount: candidates.length,
      pickedCount: picked.length,
    },
  });
}