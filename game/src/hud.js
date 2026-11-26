const el=id=>document.getElementById(id);
export function updateHUD(s,ground,distance) {
  const heading=((-s.heading*180/Math.PI)%360+360)%360;
  el('speed').textContent=Math.round(s.speed*1.944).toString().padStart(3,'0');el('altitude').textContent=Math.max(0,Math.round(s.position.y-ground)).toString().padStart(4,'0');
  el('nav').innerHTML=`<small>HDG / MAG</small>${Math.round(heading).toString().padStart(3,'0')}°<small>W · · · N · · · E</small>`;
  el('mission').innerHTML=`<span class="tag">RIDGE CIRCUIT</span><br>GATES ${s.ring} / 6 &nbsp; • &nbsp; HULL ${Math.round(s.health)}%`;
  el('throttle').textContent=`${Math.round(s.throttle*100)}%`;el('fuel').textContent=`${Math.round(s.fuel)}%`;el('throttleMeter').value=s.throttle;el('fuelMeter').value=s.fuel;
  el('timer').textContent=`${Math.floor(s.time/60).toString().padStart(2,'0')}:${Math.floor(s.time%60).toString().padStart(2,'0')}`;el('score').textContent=`SCORE ${s.score.toString().padStart(5,'0')}`;
  const bearing=Math.atan2(Math.sin(s.targetBearing||0),Math.cos(s.targetBearing||0));
  const arrow=bearing>.2?'◀':bearing<-.2?'▶':'⌄';
  el('target').innerHTML=s.ring<6?`${arrow}<br>GATE ${String(s.ring+1).padStart(2,'0')} / ${Math.round(distance)} M`:'⌄<br>RETURN TO MERAPI FIELD';
  el('message').textContent=s.message;el('horizon').firstElementChild.style.transform=`rotate(${-s.roll}rad) translateY(${s.pitch*40}px)`;
}
export function showPanel(state,score=0) {
  const panel=el('panel');panel.style.display=state==='flying'?'none':'block';
  const titles={title:'MERAPI<br>RIDGE RUN',landed:'WELCOME<br>HOME.',crashed:'FLIGHT<br>LOST.',outOfFuel:'FUEL<br>EXHAUSTED.'};
  panel.innerHTML=`<div class="eyebrow">${state==='title'?'07:10 / CENTRAL JAVA':'MERAPI FIELD / FLIGHT REPORT'}</div><h1>${titles[state]||''}</h1><p>${state==='title'?'Six golden gates. One restless volcano.<br>Thread the ridgeline and bring your aircraft home.':state==='landed'?`All six gates cleared. A safe arrival.<br>Final score: ${score}`:'Your next flight starts here. Watch airspeed, fuel and terrain.'}</p><button id="launch">${state==='title'?'ENTER • TAKE FLIGHT':'R • FLY AGAIN'}</button><p style="font-size:11px">WASD / ARROWS — PITCH & BANK<br>SHIFT / CTRL — THROTTLE · MOUSE — TRIM</p>`;
}
