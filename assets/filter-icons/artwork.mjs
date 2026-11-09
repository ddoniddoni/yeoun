// Original vector drawings for Yeoun's filter picker. One object per look.
// 64-unit artboard, shared 2-unit ink stroke; no text or external image sources.
export const INK = '#62564D';
export const filterIllustrations = [
  { id: 'original', label: '원본', body: `
    <path d="M15 12h34v40H15z" fill="#FAF8F3"/>
    <path d="M21 18h22v23H21z" fill="#EEECE5"/>
    <path d="M21 36l7-7 6 6 4-4 5 5"/>
    <circle cx="37" cy="24" r="2.5" fill="#D5CABC" stroke="none"/>
    <path d="M25 46h14"/>
  ` },
  { id: 'light-afternoon', label: '오후 네 시', body: `
    <path d="M17 12h29v35H17z" fill="#FFF4DE"/>
    <path d="M19 34l9-3v13h-9z" fill="#EBCB92" stroke="none"/>
    <circle cx="39" cy="21" r="3" fill="#D9A966" stroke="none"/>
    <path d="M32 13v33M18 29h27M14 47h35M19 52h25"/>
  ` },
  { id: 'light-milk', label: '우윳빛 아침', body: `
    <path d="M25 16v7c0 4-7 6-7 12v15c0 2 2 3 4 3h20c2 0 4-1 4-3V35c0-6-7-8-7-12v-7" fill="#F5F6F1"/>
    <path d="M19 37h26v13H19z" fill="#DAE8E1" stroke="none"/>
    <path d="M25 16v7c0 4-7 6-7 12v15c0 2 2 3 4 3h20c2 0 4-1 4-3V35c0-6-7-8-7-12v-7"/>
    <rect x="24" y="11" width="16" height="6" rx="2" fill="#C4D8CE"/>
    <path d="M24 35v9" stroke="#fff"/>
  ` },
  { id: 'light-spring', label: '봄의 공기', body: `
    <path d="M32 32v22"/>
    <path d="M31 46C21 46 16 40 17 34c8 0 13 5 14 12z" fill="#B9C9A8"/>
    <path d="M33 50c10-1 15-7 14-13-8 1-13 5-14 13z" fill="#CED9BA"/>
    <path d="M32 32C20 32 17 23 19 14l8 5 5-10 5 10 8-5c2 9-1 18-13 18z" fill="#E9B7BF"/>
    <path d="M27 19l5 6 5-6"/>
  ` },
  { id: 'portrait-clear', label: '맑은 얼굴', body: `
    <path d="M28 41v11c0 4 8 4 8 0V41" fill="#D9E8EB"/>
    <ellipse cx="32" cy="25" rx="15" ry="18" fill="#D9E8EB"/>
    <ellipse cx="32" cy="25" rx="10" ry="13" fill="#F5FAF9"/>
    <path d="M27 24l7-7M29 31l8-8" stroke="#B4CCD1"/>
  ` },
  { id: 'portrait-peach', label: '피치 스킨', body: `
    <path d="M32 25C22 14 10 21 12 34c1 9 12 16 20 19 8-3 19-10 20-19 2-13-10-20-20-9z" fill="#EBC0AA"/>
    <path d="M32 25c4 7 3 16 0 23" stroke="#B98370"/>
    <path d="M32 23c0-5 2-10 5-13"/>
    <path d="M33 17c-9 1-15-2-16-9 8-1 14 2 16 9z" fill="#B9C5A2"/>
  ` },
  { id: 'food-table', label: '오늘의 식탁', body: `
    <ellipse cx="32" cy="32" rx="15" ry="19" fill="#F3E8CC"/>
    <ellipse cx="32" cy="32" rx="10" ry="14" fill="#FFFCF5"/>
    <path d="M8 14v13c0 5 7 5 7 0V14M11.5 14v38M53 14v38M53 14c-4 4-5 11-4 20h4"/>
  ` },
  { id: 'food-cafe', label: '크림 라떼', body: `
    <path d="M45 26h3c9 0 9 13-2 13h-2" fill="#FAF6EE"/>
    <path d="M16 25h29v14c0 7-6 11-14.5 11S16 46 16 39z" fill="#E7D1B5"/>
    <ellipse cx="30.5" cy="25" rx="14.5" ry="4" fill="#9A7557"/>
    <path d="M24 25c4-2 9-2 13 0" stroke="#F4E8D5"/>
    <path d="M11 53h40M27 15c-4-5 3-5 0-10M36 16c-3-4 2-5 0-8"/>
  ` },
  { id: 'time-summer', label: '여름방학', body: `
    <path d="M11 29C15 7 45 4 53 26L11 29z" fill="#EDD49A"/>
    <path d="M11 29c3-4 7-4 10-1 3-4 7-4 11-1 3-4 7-4 11-1 3-4 7-4 10 0"/>
    <path d="M30 13c-6 5-9 10-9 15M30 13c7 3 11 8 13 13M32 28l3 24M26 54h19"/>
    <path d="M30 13l-1-4"/>
  ` },
  { id: 'retro-travel', label: '맑은 여행', body: `
    <path d="M25 18v-5c0-2 14-2 14 0v5"/>
    <rect x="12" y="19" width="40" height="31" rx="6" fill="#C5DFE4"/>
    <path d="M22 20v29M42 20v29M18 51v3M46 51v3"/>
    <path d="M28 29l10-3 3 9-10 3z" fill="#FAEAD0"/>
    <path d="M30 25l-2 4"/>
  ` },
  { id: 'retro-rose', label: '로즈 데이', body: `
    <path d="M32 34v21M32 47c-9 1-14-3-15-9 8-1 13 3 15 9z" fill="#B8CBB9"/>
    <path d="M32 52c9-1 13-5 13-11-7 0-12 4-13 11z" fill="#D0DCC6"/>
    <path d="M20 13c6-6 17-5 22 1 9 3 9 15 0 19-6 5-16 4-21-2-8-5-8-15-1-18z" fill="#DFADB7"/>
    <path d="M20 13c-1 7 6 13 13 12 6-1 9-5 9-11M21 31c-1-8 4-13 11-13 7 0 11 5 10 15M27 19c1-5 7-6 10-2"/>
  ` },
  { id: 'time-diary', label: '오래된 일기', body: `
    <path d="M20 13h27v39H20c-5 0-7-3-7-6V18c0-3 3-5 7-5z" fill="#CAD0AE"/>
    <path d="M20 13v33M14 46h32M20 52h27"/>
    <path d="M35 13v16l4-3 4 3V13" fill="#C68F79"/>
    <path d="M25 35h13M25 40h9" stroke="#93966E"/>
  ` },
  { id: 'retro-film', label: '플래시 필름', body: `
    <path d="M34 21h16v24H34" fill="#DDC697"/>
    <path d="M38 27h8v12h-8z" fill="#F7EFDB"/>
    <path d="M17 15h20v34H17z" fill="#D6BD80"/>
    <ellipse cx="27" cy="15" rx="10" ry="4" fill="#777268"/>
    <path d="M17 47c0 5 20 5 20 0M18 23h18M18 41h18"/>
    <path d="M23 10v4h8v-4z" fill="#777268"/>
    <path d="M42 23h3M42 43h3M23 31h8M23 35h5"/>
  ` },
  { id: 'retro-digital', label: '소프트 디카', body: `
    <rect x="9" y="20" width="46" height="30" rx="7" fill="#D2DBE6"/>
    <path d="M16 20v-4h10v4" fill="#E9E9E5"/>
    <path d="M12 29h40M47 35v8" stroke="#A7B5C5"/>
    <circle cx="31" cy="35" r="11" fill="#FAFAF5"/>
    <circle cx="31" cy="35" r="6" fill="#9CAFC3"/>
    <path d="M27 33c0-2 1-3 3-3" stroke="#fff"/>
    <rect x="43" y="24" width="7" height="4" rx="1" fill="#F2DAC7" stroke="none"/>
  ` },
  { id: 'scene-dawn', label: '푸른 새벽', body: `
    <path d="M10 44l14-19 12 13 8-8 11 14z" fill="#CED6E4"/>
    <path d="M10 44l14-19 6 19" fill="#ACBCD0"/>
    <path d="M39 10c-5 7-2 14 6 15-7 3-15-2-14-9 1-4 4-6 8-6z" fill="#EBDDC2"/>
    <path d="M14 49h36M22 54h20" stroke="#A2B3C5"/>
  ` },
  { id: 'scene-rain', label: '비 온 뒤', body: `
    <path d="M11 31c1-23 41-23 42 0-4-4-8-4-12 0-6-4-12-4-18 0-4-4-8-4-12 0z" fill="#BCD3C8"/>
    <path d="M32 14c-6 4-9 10-9 17M32 14c6 4 9 10 9 17M32 12v-3M32 31v18c0 7 10 7 10 0"/>
    <path d="M15 39l-2 5M23 42l-2 5M49 39l-2 5" stroke="#91B3AB"/>
  ` },
  { id: 'time-night', label: '밤의 필름', body: `
    <path d="M26 28L14 48h33L36 28z" fill="#F1DFB5" stroke="none"/>
    <path d="M42 54V18c0-11-17-12-17-1"/>
    <path d="M20 18h10l4 10H16z" fill="#C8CED0"/>
    <path d="M20 29h10M37 54h10M15 49h17"/>
  ` },
  { id: 'scene-ending', label: '엔딩 크레딧', body: `
    <path d="M12 27h40v25H12z" fill="#D2D9CF"/>
    <path d="M12 17l38-7 2 11-38 7z" fill="#F7F2E6"/>
    <path d="M20 16l7 9M34 13l7 9" stroke="#827B6C" stroke-width="6"/>
    <path d="M12 17l38-7 2 11-38 7zM12 34h40"/>
    <path d="M20 41h23M20 46h14" stroke="#9DA698"/>
  ` },
];

export function illustrationBody(icon) {
  return `<g fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.body}</g>`;
}
