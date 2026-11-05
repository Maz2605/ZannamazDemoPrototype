/** All graphics are generated as self-contained SVG; no imported images or fonts. */
(function (G) {
  'use strict';
  const ANIMALS = [
    { id: 0, name: 'Cáo', emoji: '🦊', main: '#EA965B', dark: '#82483A', light: '#FFE7C9', land: '#EDAD74' },
    { id: 1, name: 'Thỏ', emoji: '🐰', main: '#F7E6DF', dark: '#7A626F', light: '#FFFFFF', land: '#F1B9C2' },
    { id: 2, name: 'Gấu trúc', emoji: '🐼', main: '#F4F1E8', dark: '#3D424B', light: '#FFFFFF', land: '#B4D7BD' },
    { id: 3, name: 'Cú mèo', emoji: '🦉', main: '#AF91C8', dark: '#685178', light: '#F2E5F5', land: '#C8ADE2' }
  ];
  const THEMES = {
    dawn:   { sky1: '#EAF8F3', sky2: '#C9E7DB', top: '#BDE2A6', top2: '#75BD88', soil: '#9B8059', rock: '#7C6956', floral: '#FFF0B3' },
    forest: { sky1: '#E5F2DF', sky2: '#A9D5B8', top: '#99CF86', top2: '#5DAF78', soil: '#947B57', rock: '#776447', floral: '#F2EFA8' },
    snow:   { sky1: '#F3FCFC', sky2: '#D2ECF2', top: '#ECF8EB', top2: '#B5D8C6', soil: '#A5B6B7', rock: '#83999B', floral: '#FFFFFF' },
    night:  { sky1: '#D4DDF0', sky2: '#9EB7CE', top: '#B4CFB5', top2: '#7EAF98', soil: '#8688A3', rock: '#646C8A', floral: '#F6E6B7' },
    sunset: { sky1: '#FAF1D8', sky2: '#E9CBC4', top: '#C7DBAC', top2: '#8BB68E', soil: '#B0937B', rock: '#8D786B', floral: '#FFE5AD' }
  };

  function gridPoint(level, r, c) {
    const x = 380 - (level.cols - level.rows) * 51 + (c - r) * 102;
    const y = 197 + (3 - level.rows) * 28 + (4 - level.cols) * 14 + (c + r) * 61;
    return { x, y };
  }
  function pointForIndex(level, i) { return gridPoint(level, Math.floor(i / level.cols), i % level.cols); }
  function wheelPoint(level, wheel) {
    const { row, col } = G.Engine.wheelGrid(level, wheel);
    const a = gridPoint(level, row, col), b = gridPoint(level, row + 1, col + 1);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function orbitPoint(level, wheel, cell, angle) {
    const center = wheelPoint(level, wheel), p = pointForIndex(level, cell);
    const dx = (p.x - center.x) / 102, dy = (p.y - center.y) / 61;
    return {
      x: center.x + 102 * (dx * Math.cos(angle) - dy * Math.sin(angle)),
      y: center.y + 61 * (dx * Math.sin(angle) + dy * Math.cos(angle))
    };
  }
  function hubPoint(level, wheel) {
    return wheelPoint(level, wheel);
  }

  function animalShape(type) {
    const p = ANIMALS[type], m = p.main, d = p.dark, light = p.light;
    const eyes = y => `<ellipse cx="-11" cy="${y}" rx="4.1" ry="5.6" fill="${d}"/><ellipse cx="11" cy="${y}" rx="4.1" ry="5.6" fill="${d}"/><circle cx="-12" cy="${y-2}" r="1.6" fill="#fff"/><circle cx="10" cy="${y-2}" r="1.6" fill="#fff"/>`;
    let ears = '', body = '', face = '';
    if (type === 0) {
      ears = `<path d="M-28-39L-27-67Q-10-59-6-46M6-46Q10-59 27-67L28-39" fill="${m}" stroke="#B96C47" stroke-width="2" stroke-linejoin="round"/><path d="M-24-47L-23-58L-11-46M11-46L23-58L24-47" fill="#F5C5B5"/>`;
      body = `<path d="M20 3Q57-24 40 8Q31 28 17 21" fill="none" stroke="#C77143" stroke-width="19" stroke-linecap="round"/><path d="M38 4L29 12" stroke="${light}" stroke-width="9" stroke-linecap="round"/><ellipse cy="4" rx="24" ry="27" fill="${m}"/><ellipse cy="9" rx="14" ry="16" fill="${light}"/>`;
      face = `<ellipse cy="-27" rx="32" ry="27" fill="${m}"/><path d="M-29-19Q-13-12 0 1Q13-12 29-19Q24-3 0 1Q-24-3-29-19" fill="${light}"/>${eyes(-28)}<path d="M-5-13L5-13L0-7Z" fill="${d}"/><path d="M0-7q-5 5-9 0m9 0q5 5 9 0" stroke="${d}" fill="none" stroke-width="2" stroke-linecap="round"/>`;
    } else if (type === 1) {
      ears = `<ellipse cx="-15" cy="-58" rx="12" ry="32" transform="rotate(-9 -15 -58)" fill="${m}" stroke="#D7B9BD" stroke-width="2"/><ellipse cx="15" cy="-58" rx="12" ry="32" transform="rotate(9 15 -58)" fill="${m}" stroke="#D7B9BD" stroke-width="2"/><ellipse cx="-15" cy="-58" rx="6" ry="24" transform="rotate(-9 -15 -58)" fill="#E9A9BC"/><ellipse cx="15" cy="-58" rx="6" ry="24" transform="rotate(9 15 -58)" fill="#E9A9BC"/>`;
      body = `<ellipse cy="4" rx="25" ry="26" fill="${m}"/><ellipse cy="8" rx="15" ry="17" fill="${light}"/>`;
      face = `<ellipse cy="-24" rx="32" ry="29" fill="${m}"/><ellipse cx="-22" cy="-14" rx="8" ry="5" fill="#F6C0C4"/><ellipse cx="22" cy="-14" rx="8" ry="5" fill="#F6C0C4"/>${eyes(-26)}<path d="M-5-12Q0-17 5-12L0-7Z" fill="#CF8C99"/><path d="M0-7q-5 6-8 1m8-1q5 6 8 1" fill="none" stroke="${d}" stroke-width="2"/>`;
    } else if (type === 2) {
      ears = `<circle cx="-23" cy="-47" r="14" fill="${d}"/><circle cx="23" cy="-47" r="14" fill="${d}"/>`;
      body = `<ellipse cy="5" rx="25" ry="27" fill="${d}"/><ellipse cy="10" rx="17" ry="20" fill="${m}"/>`;
      face = `<ellipse cy="-24" rx="33" ry="29" fill="${m}"/><ellipse cx="-13" cy="-27" rx="12" ry="15" transform="rotate(21 -13 -27)" fill="${d}"/><ellipse cx="13" cy="-27" rx="12" ry="15" transform="rotate(-21 13 -27)" fill="${d}"/><circle cx="-10" cy="-28" r="4.4" fill="#fff"/><circle cx="12" cy="-28" r="4.4" fill="#fff"/><circle cx="-9.5" cy="-28" r="2.4" fill="#252831"/><circle cx="12.5" cy="-28" r="2.4" fill="#252831"/><ellipse cx="0" cy="-8" rx="12" ry="9" fill="#fff"/><path d="M-6-11Q0-17 6-11L0-5Z" fill="${d}"/><path d="M0-5q-5 4-8 0m8 0q5 4 8 0" fill="none" stroke="${d}" stroke-width="1.7"/>`;
    } else {
      ears = `<path d="M-30-33L-34-62L-12-46M12-46L34-62L30-33" fill="#8166A2"/>`;
      body = `<ellipse cy="5" rx="27" ry="29" fill="${m}"/><ellipse cy="5" rx="18" ry="24" fill="#E3D2EE"/><path d="M-24-2Q-44 10-22 26M24-2Q44 10 22 26" fill="none" stroke="#8A70AD" stroke-width="10" stroke-linecap="round"/>`;
      face = `<ellipse cy="-24" rx="33" ry="29" fill="${m}"/><ellipse cx="-15" cy="-26" rx="19" ry="19" fill="#EFE6F8"/><ellipse cx="15" cy="-26" rx="19" ry="19" fill="#EFE6F8"/><circle cx="-14" cy="-25" r="9" fill="#fff"/><circle cx="14" cy="-25" r="9" fill="#fff"/><circle cx="-12" cy="-25" r="5.6" fill="#685178"/><circle cx="16" cy="-25" r="5.6" fill="#685178"/><circle cx="-14" cy="-28" r="2" fill="#fff"/><circle cx="14" cy="-28" r="2" fill="#fff"/><path d="M-7-7L7-7L0 5Z" fill="#F7BC61"/>`;
    }
    return `<g class="animal-shape"><ellipse cx="0" cy="25" rx="25" ry="6" fill="#454f4533"/><path d="M-18 20Q-10 32-2 21M2 21Q10 32 18 20" fill="${m}" stroke="${d}" stroke-opacity=".12" stroke-width="2"/>${body}${ears}${face}<ellipse cx="-12" cy="-42" rx="12" ry="7" fill="#fff" opacity=".13" transform="rotate(-25 -12 -42)"/></g>`;
  }
  function animalAt(type, x, y, scale = .88) {
    return `<g transform="translate(${x} ${y-22}) scale(${scale})">${animalShape(type)}</g>`;
  }
  function island(level) {
    const t = THEMES[level.theme];
    const A = gridPoint(level,0,0), B = gridPoint(level,0,level.cols-1), C = gridPoint(level,level.rows-1,level.cols-1), D = gridPoint(level,level.rows-1,0);
    const points = [[A.x,A.y-70],[B.x+75,B.y],[C.x,C.y+73],[D.x-75,D.y]];
    const deep = points.map(([x,y])=>[x,y+34]);
    const poly = p => p.map(v=>v.join(',')).join(' ');
    let out = `<polygon points="${poly(deep)}" fill="${t.rock}"/><path d="M${points[3].join(' ')}L${points[2].join(' ')}L${deep[2].join(' ')}L${deep[3].join(' ')}Z" fill="${t.soil}"/><path d="M${points[1].join(' ')}L${points[2].join(' ')}L${deep[2].join(' ')}L${deep[1].join(' ')}Z" fill="${t.rock}"/><polygon points="${poly(points)}" fill="url(#ground-gradient)" stroke="#f1edd3" stroke-width="5" stroke-linejoin="round"/>`;
    for (let k=0;k<12;k++) {
      const a=points[k%4],b=points[(k+1)%4],fraction=.13+(k%5)*.18;
      let x=a[0]+(b[0]-a[0])*fraction,y=a[1]+(b[1]-a[1])*fraction;
      x+=(380-x)*.09;y+=(340-y)*.09;
      if (k%3===0)out+=`<g transform="translate(${x} ${y})" opacity=".85"><path d="M0 0Q-15-22-19-3M0 0Q15-22 19-3" fill="none" stroke="#448e68" stroke-width="5" stroke-linecap="round"/><circle cy="-9" r="5" fill="${t.floral}"/></g>`;
      else out+=`<ellipse cx="${x}" cy="${y}" rx="${5+k%6}" ry="${3+k%4}" fill="${k%2?'#e6d9b6':'#79b98f'}" opacity=".7"/>`;
    }
    return out;
  }
  function pedestal(level, state, i) {
    const {x,y}=pointForIndex(level,i),type=i%level.cols,p=ANIMALS[type],correct=state[i]===type;
    const front=`${x-56},${y} ${x},${y+32} ${x},${y+49} ${x-56},${y+17}`;
    const right=`${x},${y+32} ${x+56},${y} ${x+56},${y+17} ${x},${y+49}`;
    const triggers=(level.seals||[]).filter(([,cell])=>cell===i).map(([w,,animal])=>{
      const ready=state[i]===animal;
      return `<g class="rune-trigger ${ready?'open':''}" data-trigger="${w}"><rect x="${x-47}" y="${y+40}" width="94" height="22" rx="8" fill="${ready?'#e0f6d5':'#eee0ff'}" stroke="${ready?'#55a879':'#9471bd'}" stroke-width="2"/><text x="${x}" y="${y+55}" text-anchor="middle" fill="#59416e" font-size="14">${'①②③④⑤⑥'[w]} ${ANIMALS[animal].emoji} ${ready?'✓':'◇'}</text></g>`;
    }).join('');
    return `<g>
      <ellipse cx="${x}" cy="${y+43}" rx="56" ry="17" fill="#3f6d5736"/>
      <polygon points="${front}" fill="#C49D79" stroke="#B59B79"/>
      <polygon points="${right}" fill="#A78668" stroke="#9B7F63"/>
      <polygon points="${x},${y-32} ${x+56},${y} ${x},${y+32} ${x-56},${y}" fill="${correct?'#EAF9DA':'#F2E6CC'}" stroke="${correct?'#82CDA0':'#D5BD99'}" stroke-width="${correct?4:3}" stroke-linejoin="round"/>
      <polygon points="${x},${y-24} ${x+42},${y} ${x},${y+24} ${x-42},${y}" fill="${p.land}" opacity=".27"/>
      <ellipse cx="${x}" cy="${y+3}" rx="35" ry="19" fill="${correct?'#89CC9D':'#E3CAA4'}" opacity=".55"/>
      ${correct?`<ellipse cx="${x}" cy="${y}" rx="40" ry="20" fill="none" stroke="#62BE95" stroke-width="3" stroke-dasharray="4 5" opacity=".7"/>`:''}
      <circle cx="${x+8}" cy="${y+33}" r="13" fill="${p.land}" stroke="#fff9e8" stroke-width="2"/>
      <text x="${x+8}" y="${y+37}" text-anchor="middle" font-size="15">${p.emoji}</text>
      ${correct?`<circle cx="${x-35}" cy="${y+2}" r="10" fill="#4DAE7E" stroke="#fff" stroke-width="1.5"/><text x="${x-35}" y="${y+6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#fff">✓</text>`:''}
      ${triggers}
    </g>`;
  }
  function wheel(level, id, state) {
    // Compact floor dial centered on the intersection of the four pedestals.
    const {x,y}=hubPoint(level,id);
    const locked=G.Engine.isBlocked(level,id),linked=level.link&&level.link.slice(0,2).includes(id);
    const rune=G.Engine.isRuneLocked(level,state,id), seal=(level.seals||[]).find(([w])=>w===id), one=(level.oneWay||[]).find(([w])=>w===id);
    const clr=locked?'#8A9696':seal?'#8964b0':linked?'#C28C45':'#438F86',fill=locked?'#DFE1D7':rune?'#e7d8f6':seal?'#ddf4dc':linked?'#FFF0C6':'#D7F5E8';
    const hint=seal?` · Ấn ${id+1}: cần ${ANIMALS[seal[2]].name} trên bệ đánh dấu`:one?` · Chỉ vuốt ${one[1]===1?'trái':'phải'}`:'';
    return `<g class="wheel ${locked?'locked':''} ${linked?'linked':''} ${rune?'rune-locked':''}" data-wheel="${id}" role="group" ${locked?'aria-disabled="true"':'tabindex="0"'} aria-label="Mâm xoay ${id+1}${locked?' bị phong ấn':hint||': chọn rồi vuốt trái hoặc phải; hỗ trợ phím trái hoặc phải'}" aria-describedby="drag-instruction">
      <title>${locked?'Vòng bị phong ấn':hint||'Chạm chọn cụm · Vuốt phải ↺ hoặc trái ↻ ở bất kỳ đâu trên bàn'}</title>
      <ellipse cx="${x}" cy="${y+5}" rx="27" ry="17" fill="#38584f35" pointer-events="none"/>
      <ellipse class="wheel-body" cx="${x}" cy="${y+3}" rx="26" ry="17" fill="${clr}" stroke="${clr}" stroke-width="2"/>
      <ellipse cx="${x}" cy="${y}" rx="26" ry="17" fill="${fill}" stroke="${clr}" stroke-width="2"/>
      <g class="wheel-rotor" data-rotor="${id}" transform="translate(${x} ${y}) scale(.62 .37)">
        <g class="rotor-spokes" stroke="${clr}" stroke-width="6" stroke-linecap="round"><path d="M-29 0H29M0-29V29"/><path d="M-20-20L20 20M-20 20L20-20" stroke-width="3" opacity=".55"/></g>
        <circle r="30" fill="none" stroke="${clr}" stroke-width="3"/>
        <circle r="8" fill="#fff9df" stroke="${clr}" stroke-width="3"/>
        <circle cy="-30" r="5" fill="#e8b856" stroke="#fff9df" stroke-width="2"/>
      </g>
      ${locked?`<text x="${x}" y="${y+6}" font-size="20" text-anchor="middle" pointer-events="none">🔒</text>`:''}
      ${linked?`<circle cx="${x+23}" cy="${y-15}" r="9" fill="#E9B765" stroke="#fff2d5" stroke-width="2"/><text x="${x+23}" y="${y-11}" font-size="12" text-anchor="middle" fill="#765123" pointer-events="none">⚙</text>`:''}
      ${one?`<g class="one-way-badge" pointer-events="none"><rect x="${x-75}" y="${y-35}" width="50" height="20" rx="9" fill="#fff1c6" stroke="#c79d45" stroke-width="2"/><text x="${x-50}" y="${y-20}" text-anchor="middle" font-size="13" fill="#76521d">Chỉ ${one[1]===1?'←':'→'}</text></g>`:''}
      ${seal?`<text class="rune-badge" x="${x-28}" y="${y-17}" font-size="18" fill="#755097" pointer-events="none">${'①②③④⑤⑥'[id]}${rune?'◇':'✓'}</text>`:''}
      <ellipse class="wheel-hit" cx="${x}" cy="${y}" rx="40" ry="30" fill="transparent"/>
    </g>`;
  }
  function wheelTrack(level, id) {
    const {x,y} = wheelPoint(level,id);
    const locked = G.Engine.isBlocked(level,id), linked = level.link?.slice(0,2).includes(id);
    const color = locked?'#89938b':linked?'#c28c45':'#438f86';
    return `<g class="wheel-track" data-track="${id}" pointer-events="none" stroke="${color}" fill="none">
      <ellipse cx="${x}" cy="${y}" rx="102" ry="61" stroke-width="5"/>
      <ellipse cx="${x}" cy="${y}" rx="114" ry="69" stroke-width="2" stroke-dasharray="5 9"/>
      <g data-arms="${id}" transform="translate(${x} ${y}) scale(102 61)"><path d="M-1 0H1M0-1V1" stroke-width=".035"/><circle r=".18" fill="${color}" stroke-width=".04"/></g>
    </g>`;
  }
  function background(level) {
    const t=THEMES[level.theme];
    let out=`<defs>
    <linearGradient id="sky-gradient" x1="0" y1="0" x2=".6" y2="1"><stop stop-color="${t.sky1}"/><stop offset="1" stop-color="${t.sky2}"/></linearGradient>
    <linearGradient id="ground-gradient" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${t.top}"/><stop offset="1" stop-color="${t.top2}"/></linearGradient>
    <radialGradient id="light-gradient"><stop stop-color="#fffbdc" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <rect width="760" height="660" fill="url(#sky-gradient)"/>
    <circle cx="390" cy="260" r="310" fill="url(#light-gradient)"/>
    <circle cx="650" cy="88" r="34" fill="${level.theme==='night'?'#F4F2DC':'#FFF8CE'}" opacity=".72"/>
    <g fill="#fff" opacity=".43"><ellipse cx="103" cy="106" rx="81" ry="18"/><ellipse cx="145" cy="96" rx="44" ry="25"/><ellipse cx="650" cy="149" rx="92" ry="15"/></g>
    <ellipse cx="392" cy="569" rx="${level.rows===2?235:298}" ry="32" fill="#538b74" opacity=".15"/>`;
    if(level.theme==='night')for(let i=0;i<18;i++){const x=50+(i*173)%660,y=48+(i*113)%160;out+=`<circle cx="${x}" cy="${y}" r="${i%3===0?3:1.7}" fill="#fffbe5" opacity=".8"/>`;}
    out+=island(level);
    out+=`<g opacity=".52"><g transform="translate(108 390)"><path d="M0 0Q-42-65-22-95Q-9-73 0 0M0 0Q33-77 48-70Q51-40 0 0" fill="#5EAB84"/></g><g transform="translate(668 454)"><path d="M0 0Q-24-36-11-69Q8-44 0 0M0 0Q28-57 41-45Q39-20 0 0" fill="#5EAB84"/></g></g>`;
    return out;
  }
  function scene(level, state, hidden = null) {
    let svg = background(level);
    const indices=Array.from({length:state.length},(_,i)=>i);
    // Isometric painter's order: back rows painted before foreground rows.
    indices.sort((a,b)=>{
      const p1=pointForIndex(level,a),p2=pointForIndex(level,b);
      return p1.y-p2.y || p1.x-p2.x;
    });
    for(const i of indices)svg+=pedestal(level,state,i);
    for(let w=0;w<G.Engine.wheelCount(level);w++)svg+=wheelTrack(level,w);
    // All visible dial parts sit below animals, including hover/selection rings.
    for(let w=0;w<G.Engine.wheelCount(level);w++)svg+=wheel(level,w,state);
    for(const i of indices){
      if(!hidden||!hidden.has(i)){
        const p=pointForIndex(level,i);
        svg+=`<g data-cell="${i}" pointer-events="none"><ellipse class="animal-hit" cx="${p.x}" cy="${p.y-44}" rx="37" ry="42" fill="transparent" pointer-events="all"/>${animalAt(state[i],p.x,p.y)}</g>`;
      }
    }
    // Input stays reachable without painting anything over a face.
    for(let w=0;w<G.Engine.wheelCount(level);w++) {
      const p=hubPoint(level,w);
      svg+=`<g class="wheel-target" data-wheel="${w}" aria-hidden="true"><ellipse cx="${p.x}" cy="${p.y}" rx="40" ry="30" fill="transparent" pointer-events="all"/></g>`;
    }
    return svg+'<g id="flying-sprites"></g>';
  }
  G.Art={ ANIMALS, THEMES, gridPoint, pointForIndex, wheelPoint, hubPoint, orbitPoint, animalShape, animalAt, scene };
})(window.SpiritGrove);
