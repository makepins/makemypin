import { useState, useRef, useEffect } from "react";
import { useUser, SignIn, SignUp, UserButton } from "@clerk/clerk-react";

const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Montserrat:wght@400;500;700;900&family=League+Spartan:wght@400;700;900&family=Playfair+Display:wght@400;700;900&family=Poppins:wght@400;500;700;900&family=Righteous&family=DM+Serif+Display&display=swap";

const FONTS = [
  { name: "Barlow",    stack: "'Barlow Condensed', sans-serif" },
  { name: "Montserrat",stack: "'Montserrat', sans-serif" },
  { name: "Spartan",   stack: "'League Spartan', sans-serif" },
  { name: "Playfair",  stack: "'Playfair Display', serif" },
  { name: "Poppins",   stack: "'Poppins', sans-serif" },
  { name: "Righteous", stack: "'Righteous', sans-serif" },
  { name: "DM Serif",  stack: "'DM Serif Display', serif" },
];

const LEAGUE_SPARTAN = "'League Spartan', sans-serif";

const COMBOS = [
  { name: "Classic",  box: "#ffffff", text: "#2a2a2a", border: "#333333" },
  { name: "Midnight", box: "#111111", text: "#ffffff", border: "#444444" },
  { name: "Ocean",    box: "#00897b", text: "#ffffff", border: "#00695c" },
  { name: "Sunset",   box: "#e53935", text: "#ffffff", border: "#b71c1c" },
  { name: "Golden",   box: "#ff9500", text: "#3a1f00", border: "#cc7700" },
  { name: "Sky",      box: "#1a56ff", text: "#ffffff", border: "#0033cc" },
  { name: "Blush",    box: "#e91e8c", text: "#ffffff", border: "#ad1457" },
  { name: "Forest",   box: "#388e3c", text: "#ffffff", border: "#1b5e20" },
  { name: "Violet",   box: "#7c3aed", text: "#ffffff", border: "#4c1d95" },
  { name: "Sand",     box: "#f5e6c8", text: "#3a2a00", border: "#c9a86c" },
];

const TEMPLATES = [
  { id: "basic",      name: "Basic" },
  { id: "box",        name: "Box" },
  { id: "seethrough", name: "See Through" },
  { id: "split",      name: "Split" },
  { id: "quad",       name: "Quad" },
];

const W = 1000, H = 1778;

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function autoFont(ctx, text, maxW, maxSize, minSize, weight, stack) {
  let size = maxSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${stack}`;
    if (ctx.measureText(text).width <= maxW) break;
    size -= 1;
  }
  return size;
}

function wrapText(ctx, text, maxW) {
  const words = text.split(" "); let line = "", lines = [];
  for (let w of words) {
    const t = line + w + " ";
    if (ctx.measureText(t).width > maxW && line) { lines.push(line.trim()); line = w + " "; }
    else line = t;
  }
  if (line) lines.push(line.trim());
  return lines;
}

function drawImg(ctx, img, off, zx, zy, zw, zh) {
  ctx.save(); ctx.beginPath(); ctx.rect(zx, zy, zw, zh); ctx.clip();
  if (!img) {
    ctx.fillStyle = "#aaa"; ctx.fillRect(zx, zy, zw, zh);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "14px 'Montserrat',sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Upload photo", zx + zw/2, zy + zh/2 + 5);
  } else {
    const s = Math.max(zw/img.width, zh/img.height);
    const sw = img.width*s, sh = img.height*s;
    ctx.drawImage(img, zx+(zw-sw)/2+off.x, zy+(zh-sh)/2+off.y, sw, sh);
  }
  ctx.restore();
}

function renderBasic(ctx, state, font, combo) {
  ctx.fillStyle = "#555"; ctx.fillRect(0,0,W,H);
  drawImg(ctx, state.img, state.off, 0, 0, W, H);
  const headline = state.headline || "Your Headline Here";
  const hSize = autoFont(ctx, headline.toUpperCase(), W*0.86, W*0.115, W*0.04, "900", font);
  const hLines = wrapText(ctx, headline.toUpperCase(), W*0.86);
  ctx.font = `900 ${hSize}px ${font}`;
  const hLH = hSize*1.18, hTH = hLines.length*hLH;
  const subSize = state.subtitle ? autoFont(ctx, state.subtitle, W*0.8, W*0.052, W*0.025, "500", font) : 0;
  const gap = state.subtitle ? subSize*0.5 : 0;
  const totalH = hTH + gap + subSize;
  const startY = H/2 - totalH/2;
  ctx.textAlign = "center";
  ctx.font = `900 ${hSize}px ${font}`; ctx.fillStyle = combo.text;
  ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 18;
  hLines.forEach((l,i) => ctx.fillText(l, W/2, startY + i*hLH + hSize*0.88));
  ctx.shadowBlur = 0;
  if (state.subtitle) {
    ctx.font = `500 ${subSize}px ${font}`; ctx.fillStyle = combo.text; ctx.globalAlpha = 0.88;
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 8;
    ctx.fillText(state.subtitle, W/2, startY + hTH + gap + subSize*0.88);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
  if (state.site) {
    ctx.shadowBlur = 0;
    ctx.font = `700 ${W*0.05}px ${LEAGUE_SPARTAN}`;
    const pw = ctx.measureText(state.site).width + W*0.08, ph = W*0.078;
    const px = (W-pw)/2, py = H*0.04;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    roundRect(ctx, px, py, pw, ph, ph/2); ctx.fill();
    ctx.fillStyle = "#111"; ctx.textAlign = "center";
    ctx.fillText(state.site, W/2, py + ph*0.68);
  }
}

function renderBox(ctx, state, font, combo) {
  ctx.fillStyle = "#555"; ctx.fillRect(0,0,W,H);
  drawImg(ctx, state.img, state.off, 0, 0, W, H);
  const pFS = autoFont(ctx, (state.prefix||"5 Things").toUpperCase(), W*0.75, W*0.065, W*0.03, "700", font);
  const lFS = autoFont(ctx, state.location||"Italy", W*0.75, W*0.052, W*0.025, "500", font);
  const mainText = state.main || "To Do in Rome";
  const mFS = autoFont(ctx, mainText.toUpperCase(), W*0.82, W*0.105, W*0.035, "900", font);
  ctx.font = `900 ${mFS}px ${font}`;
  const mLines = wrapText(ctx, mainText.toUpperCase(), W*0.82);
  const mLH = mFS*1.2, mBH = mLines.length*mLH + W*0.065;
  const pBH = pFS*1.9, lBH = lFS*2.2;
  const bW = W*0.82, bX = (W-bW)/2, bY = H*0.58;
  ctx.fillStyle = "rgba(255,252,245,0.97)"; ctx.fillRect(bX, bY, bW, pBH);
  ctx.font = `700 ${pFS}px ${font}`; ctx.textAlign = "center"; ctx.fillStyle = "#1a1a1a";
  ctx.fillText((state.prefix||"5 Things").toUpperCase(), W/2, bY + pBH*0.68);
  const b2Y = bY + pBH;
  ctx.fillStyle = combo.box; ctx.fillRect(bX, b2Y, bW, mBH);
  ctx.font = `900 ${mFS}px ${font}`; ctx.fillStyle = combo.text;
  ctx.shadowColor = "rgba(0,0,0,0.2)"; ctx.shadowBlur = 4;
  const mSY = b2Y + (mBH - mLines.length*mLH)/2 + mFS*0.88;
  mLines.forEach((l,i) => ctx.fillText(l, W/2, mSY + i*mLH));
  ctx.shadowBlur = 0;
  const b3Y = b2Y + mBH;
  ctx.fillStyle = "rgba(255,252,245,0.97)"; ctx.fillRect(bX, b3Y, bW, lBH);
  ctx.font = `italic 500 ${lFS}px ${font}`; ctx.fillStyle = "#333";
  ctx.fillText(state.location||"Italy", W/2, b3Y + lBH*0.67);
  if (state.site) {
    ctx.font = `700 ${W*0.048}px ${LEAGUE_SPARTAN}`; ctx.textAlign = "center"; ctx.fillStyle = "#111111";
    ctx.shadowColor = "rgba(255,255,255,0.7)"; ctx.shadowBlur = 10;
    ctx.fillText(state.site, W/2, H*0.07); ctx.shadowBlur = 0;
  }
}

function renderSeeThrough(ctx, state, font, combo) {
  ctx.fillStyle = "#555"; ctx.fillRect(0,0,W,H);
  drawImg(ctx, state.img, state.off, 0, 0, W, H);
  const bX = W*0.05, bW = W*0.9, bY = H*0.05;
  const titleText = state.title || "The Title Placement Text";
  const tFS = autoFont(ctx, titleText, bW-W*0.1, W*0.105, W*0.035, "700", font);
  ctx.font = `700 ${tFS}px ${font}`;
  const tLines = wrapText(ctx, titleText, bW-W*0.1);
  const tLH = tFS*1.18, tH = tLines.length*tLH, bH = tH + W*0.1;
  ctx.fillStyle = hexToRgba(combo.box, 0.75); ctx.fillRect(bX, bY, bW, bH);
  ctx.strokeStyle = "#111111"; ctx.lineWidth = 2; ctx.strokeRect(bX, bY, bW, bH);
  ctx.font = `700 ${tFS}px ${font}`; ctx.textAlign = "center"; ctx.fillStyle = combo.text;
  const tSY = bY + (bH-tH)/2 + tFS*0.88;
  tLines.forEach((l,i) => ctx.fillText(l, W/2, tSY + i*tLH));
  const barH = W*0.075, barY = H - barH;
  ctx.fillStyle = combo.box; ctx.fillRect(0, barY, W, barH);
  if (state.site) {
    ctx.font = `700 ${W*0.042}px ${LEAGUE_SPARTAN}`; ctx.textAlign = "center"; ctx.fillStyle = combo.text;
    ctx.fillText(state.site, W/2, barY + barH*0.68);
  }
}

function renderSplit(ctx, state, font, combo) {
  const lineW = 4, boxH = H*0.20, midY = H*0.48, bTop = midY-boxH/2, bBot = bTop+boxH;
  drawImg(ctx, state.img1, state.off1, 0, 0, W, bTop);
  drawImg(ctx, state.img2, state.off2, 0, bBot, W, H-bBot);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, bTop-lineW, W, lineW); ctx.fillRect(0, bBot, W, lineW);
  ctx.fillStyle = combo.box; ctx.fillRect(0, bTop, W, boxH);
  const subText = state.subtitle || "Subtitle Text", mainText = state.main || "MAIN TEXT";
  const subSize = autoFont(ctx, subText.toUpperCase(), W*0.88, W*0.044, W*0.022, "500", font);
  const mainSize = autoFont(ctx, mainText.toUpperCase(), W*0.9, W*0.13, W*0.035, "900", font);
  const mLines = wrapText(ctx, mainText.toUpperCase(), W*0.9);
  ctx.font = `900 ${mainSize}px ${font}`;
  const mLH = mainSize*1.05, mTH = mLines.length*mLH;
  const gap = subSize*0.3, totalBlock = subSize + gap + mTH;
  const sY = bTop + (boxH-totalBlock)/2;
  ctx.textAlign = "center";
  ctx.font = `500 ${subSize}px ${font}`; ctx.fillStyle = combo.text; ctx.globalAlpha = 0.9;
  ctx.fillText(subText.toUpperCase(), W/2, sY + subSize); ctx.globalAlpha = 1;
  ctx.font = `900 ${mainSize}px ${font}`; ctx.fillStyle = combo.text;
  ctx.shadowColor = "rgba(0,0,0,0.2)"; ctx.shadowBlur = 4;
  mLines.forEach((l,i) => ctx.fillText(l, W/2, sY + subSize + gap + i*mLH + mainSize*0.88));
  ctx.shadowBlur = 0;
  if (state.site) {
    ctx.font = `700 ${W*0.042}px ${LEAGUE_SPARTAN}`; ctx.textAlign = "left"; ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 8;
    ctx.fillText(state.site, W*0.06, H*0.958); ctx.shadowBlur = 0;
  }
}

function renderQuad(ctx, state, font, combo) {
  const g = 3, hw = (W-g)/2, hh = (H-g)/2;
  const zones = [{x:0,y:0,w:hw,h:hh},{x:hw+g,y:0,w:hw,h:hh},{x:0,y:hh+g,w:hw,h:hh},{x:hw+g,y:hh+g,w:hw,h:hh}];
  zones.forEach((z,i) => drawImg(ctx, state.imgs[i], state.offs[i], z.x, z.y, z.w, z.h));
  ctx.fillStyle = "#ffffff"; ctx.fillRect(hw, 0, g, H); ctx.fillRect(0, hh, W, g);
  const bW = W*0.72, bX = (W-bW)/2, bCY = H/2;
  const topT = state.topText || "Location", mainT = state.mainText || "Travel Guide";
  const tFS = autoFont(ctx, topT.toUpperCase(), bW*0.8, W*0.055, W*0.025, "600", font);
  const mFS = autoFont(ctx, mainT, bW*0.88, W*0.13, W*0.04, "700", font);
  const pad = W*0.055, topH = tFS*1.4, mainH = mFS*1.5;
  const innerH = topH + 1.5 + pad*0.6 + mainH, bH = innerH + pad*2, bY = bCY - bH/2;
  ctx.fillStyle = combo.box; ctx.fillRect(bX, bY, bW, bH);
  ctx.strokeStyle = combo.border||"#333"; ctx.lineWidth = 1.5; ctx.strokeRect(bX, bY, bW, bH);
  ctx.font = `600 ${tFS}px ${font}`; ctx.textAlign = "center"; ctx.fillStyle = combo.text;
  ctx.fillText(topT.toUpperCase(), W/2, bY + pad + tFS*0.88);
  const dY = bY + pad + topH + pad*0.3;
  ctx.strokeStyle = combo.text==="#ffffff" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.2)";
  ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bX+bW*0.1, dY); ctx.lineTo(bX+bW*0.9, dY); ctx.stroke();
  ctx.font = `700 ${mFS}px ${font}`; ctx.fillStyle = combo.text;
  ctx.shadowColor = "rgba(0,0,0,0.1)"; ctx.shadowBlur = 3;
  ctx.fillText(mainT, W/2, dY + pad*0.4 + mFS*0.88); ctx.shadowBlur = 0;
  if (state.site) {
    ctx.font = `700 ${W*0.038}px ${LEAGUE_SPARTAN}`; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 8;
    ctx.fillText(state.site, W/2, H*0.965); ctx.shadowBlur = 0;
  }
}

function useWindowSize() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function TemplateThumb({ tid, onClick }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const tw = c.width, th = c.height;
    const font = "'Montserrat', sans-serif";
    ctx.clearRect(0,0,tw,th);
    if (tid==="basic") {
      ctx.fillStyle="#7a9bb5"; ctx.fillRect(0,0,tw,th);
      ctx.font=`900 ${tw*0.18}px ${font}`; ctx.textAlign="center"; ctx.fillStyle="#fff";
      ctx.shadowColor="rgba(0,0,0,0.5)"; ctx.shadowBlur=6; ctx.fillText("TITLE",tw/2,th*0.52); ctx.shadowBlur=0;
      ctx.font=`500 ${tw*0.08}px ${font}`; ctx.fillStyle="rgba(255,255,255,0.8)"; ctx.fillText("SUBTITLE",tw/2,th*0.64);
    } else if (tid==="box") {
      ctx.fillStyle="#8faa7a"; ctx.fillRect(0,0,tw,th);
      const bw=tw*0.82,bx=(tw-bw)/2,by=th*0.56;
      ctx.fillStyle="#fff8f0"; ctx.fillRect(bx,by,bw,th*0.13);
      ctx.fillStyle="#e53935"; ctx.fillRect(bx,by+th*0.13,bw,th*0.2);
      ctx.fillStyle="#fff8f0"; ctx.fillRect(bx,by+th*0.33,bw,th*0.1);
      ctx.font=`900 ${tw*0.09}px ${font}`; ctx.textAlign="center"; ctx.fillStyle="#fff";
      ctx.fillText("MAIN",tw/2,by+th*0.13+th*0.15);
    } else if (tid==="seethrough") {
      ctx.fillStyle="#a07060"; ctx.fillRect(0,0,tw,th);
      ctx.fillStyle="rgba(255,200,0,0.72)"; ctx.fillRect(tw*0.05,th*0.08,tw*0.9,th*0.3);
      ctx.strokeStyle="#111"; ctx.lineWidth=1.5; ctx.strokeRect(tw*0.05,th*0.08,tw*0.9,th*0.3);
      ctx.font=`700 ${tw*0.13}px ${font}`; ctx.textAlign="center"; ctx.fillStyle="#1a1a1a";
      ctx.fillText("TITLE",tw/2,th*0.27);
      ctx.fillStyle="#f5c800"; ctx.fillRect(0,th*0.9,tw,th*0.1);
    } else if (tid==="split") {
      ctx.fillStyle="#5a8a9f"; ctx.fillRect(0,0,tw,th*0.46);
      ctx.fillStyle="#8a6a50"; ctx.fillRect(0,th*0.54,tw,th*0.46);
      ctx.fillStyle="#e53935"; ctx.fillRect(0,th*0.415,tw,th*0.17);
      ctx.fillStyle="#fff"; ctx.fillRect(0,th*0.41,tw,3); ctx.fillRect(0,th*0.585,tw,3);
      ctx.font=`900 ${tw*0.12}px ${font}`; ctx.textAlign="center"; ctx.fillStyle="#fff";
      ctx.fillText("TEXT",tw/2,th*0.525);
    } else if (tid==="quad") {
      const g=2,hw=(tw-g)/2,hh=(th-g)/2;
      ctx.fillStyle="#6a9ab0"; ctx.fillRect(0,0,hw,hh);
      ctx.fillStyle="#b08060"; ctx.fillRect(hw+g,0,hw,hh);
      ctx.fillStyle="#7a9a70"; ctx.fillRect(0,hh+g,hw,hh);
      ctx.fillStyle="#a07080"; ctx.fillRect(hw+g,hh+g,hw,hh);
      ctx.fillStyle="#fff"; ctx.fillRect(hw,0,g,th); ctx.fillRect(0,hh,tw,g);
      const bw=tw*0.7,bh=th*0.26,bx=(tw-bw)/2,by=(th-bh)/2;
      ctx.fillStyle="#fff"; ctx.fillRect(bx,by,bw,bh);
      ctx.strokeStyle="#333"; ctx.lineWidth=1.5; ctx.strokeRect(bx,by,bw,bh);
      ctx.font=`700 ${tw*0.1}px ${font}`; ctx.textAlign="center"; ctx.fillStyle="#2a2a2a";
      ctx.fillText("GUIDE",tw/2,by+bh*0.68);
    }
  }, [tid]);
  return (
    <div onClick={onClick} style={{ cursor:"pointer", borderRadius:8, overflow:"hidden", border:"2px solid #e5e5e5", transition:"all 0.15s" }}
      onMouseEnter={e=>e.currentTarget.style.borderColor="#333"}
      onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e5e5"}>
      <canvas ref={ref} width={240} height={426} style={{display:"block",width:"100%"}} />
      <div style={{fontSize:10,textAlign:"center",padding:"5px 4px",color:"#666",fontWeight:500}}>{tid.charAt(0).toUpperCase()+tid.slice(1)}</div>
    </div>
  );
}

function initState(tid) {
  if (tid==="basic") return {img:null,off:{x:0,y:0},site:"",headline:"",subtitle:""};
  if (tid==="box") return {img:null,off:{x:0,y:0},site:"",prefix:"",main:"",location:""};
  if (tid==="seethrough") return {img:null,off:{x:0,y:0},site:"",title:""};
  if (tid==="split") return {img1:null,img2:null,off1:{x:0,y:0},off2:{x:0,y:0},site:"",subtitle:"",main:""};
  if (tid==="quad") return {imgs:[null,null,null,null],offs:[{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}],site:"",topText:"",mainText:""};
}

export default function App() {
  const [screen, setScreen] = useState("select");
  const [template, setTemplate] = useState(null);
  const [font, setFont] = useState(FONTS[0]);
  const [combo, setCombo] = useState(COMBOS[0]);
  const [state, setState] = useState({});
  const canvasRef = useRef(null);
  const dragRef = useRef({dragging:null,lastMouse:null});

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (screen !== "editor") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    document.fonts.ready.then(() => {
      ctx.clearRect(0,0,W,H);
      if (template==="basic") renderBasic(ctx, state, font.stack, combo);
      else if (template==="box") renderBox(ctx, state, font.stack, combo);
      else if (template==="seethrough") renderSeeThrough(ctx, state, font.stack, combo);
      else if (template==="split") renderSplit(ctx, state, font.stack, combo);
      else if (template==="quad") renderQuad(ctx, state, font.stack, combo);
    });
  }, [screen, template, font, combo, state]);

  const openTemplate = (tid) => {
    setTemplate(tid); setState(initState(tid)); setScreen("editor"); setRepositionMode(false);
  };

  const updateState = (key, val) => setState(prev => ({...prev, [key]: val}));

  const loadFile = (file, key, isQuad=false, quadIdx=0) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        if (isQuad) {
          setState(prev => {
            const imgs = [...prev.imgs], offs = [...prev.offs];
            imgs[quadIdx] = img; offs[quadIdx] = {x:0,y:0};
            return {...prev, imgs, offs};
          });
        } else {
          setState(prev => {
            const offKey = key==="img1" ? "off1" : key==="img2" ? "off2" : "off";
            return {...prev, [key]: img, [offKey]: {x:0,y:0}};
          });
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const getDragZone = (cx, cy) => {
    if (["basic","box","seethrough"].includes(template)) return state.img ? 0 : null;
    if (template==="split") {
      const bTop = H*0.48 - H*0.10, bBot = H*0.48 + H*0.10;
      if (cy < bTop && state.img1) return 1;
      if (cy > bBot && state.img2) return 2;
      return null;
    }
    if (template==="quad") {
      const g=3,hw=(W-g)/2,hh=(H-g)/2;
      const zones=[{x:0,y:0,w:hw,h:hh},{x:hw+g,y:0,w:hw,h:hh},{x:0,y:hh+g,w:hw,h:hh},{x:hw+g,y:hh+g,w:hw,h:hh}];
      for(let i=0;i<4;i++){const z=zones[i];if(cx>=z.x&&cx<=z.x+z.w&&cy>=z.y&&cy<=z.y+z.h&&state.imgs[i])return i;}
      return null;
    }
  };

  const applyDrag = (zone, dx, dy) => {
    setState(prev => {
      if (["basic","box","seethrough"].includes(template)) return {...prev, off:{x:prev.off.x+dx, y:prev.off.y+dy}};
      if (template==="split") {
        if (zone===1) return {...prev, off1:{x:prev.off1.x+dx, y:prev.off1.y+dy}};
        return {...prev, off2:{x:prev.off2.x+dx, y:prev.off2.y+dy}};
      }
      if (template==="quad") {
        const offs = [...prev.offs];
        offs[zone] = {x:offs[zone].x+dx, y:offs[zone].y+dy};
        return {...prev, offs};
      }
      return prev;
    });
  };

  const [repositionMode, setRepositionMode] = useState(false);

  const onMouseDown = (e) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const cx = (e.clientX-r.left)*(W/r.width), cy = (e.clientY-r.top)*(H/r.height);
    const zone = getDragZone(cx, cy);
    if (zone !== null) { dragRef.current = {dragging:zone, lastMouse:{x:e.clientX,y:e.clientY}}; }
  };

  const onMouseMove = (e) => {
    const {dragging, lastMouse} = dragRef.current;
    if (dragging === null || dragging === undefined) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX-lastMouse.x)*(W/r.width), dy = (e.clientY-lastMouse.y)*(H/r.height);
    applyDrag(dragging, dx, dy);
    dragRef.current.lastMouse = {x:e.clientX, y:e.clientY};
  };

  const onMouseUp = () => { dragRef.current = {dragging:null, lastMouse:null}; };

  const onTouchStart = (e) => {
    if (!repositionMode) return;
    e.preventDefault();
    const t = e.touches[0], canvas = canvasRef.current; if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const cx = (t.clientX-r.left)*(W/r.width), cy = (t.clientY-r.top)*(H/r.height);
    const zone = getDragZone(cx, cy);
    if (zone !== null) dragRef.current = {dragging:zone, lastMouse:{x:t.clientX,y:t.clientY}};
  };

  const onTouchMove = (e) => {
    if (!repositionMode) return;
    e.preventDefault();
    const {dragging, lastMouse} = dragRef.current;
    if (dragging === null || dragging === undefined) return;
    const t = e.touches[0], canvas = canvasRef.current; if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const dx = (t.clientX-lastMouse.x)*(W/r.width), dy = (t.clientY-lastMouse.y)*(H/r.height);
    applyDrag(dragging, dx, dy);
    dragRef.current.lastMouse = {x:t.clientX, y:t.clientY};
  };

  const download = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const link = document.createElement("a");
    link.download = `makemypin-${template}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const isMobile = useWindowSize();
  const { isSignedIn, isLoaded, user } = useUser();
  const [authScreen, setAuthScreen] = useState("signin");
  const [subscribing, setSubscribing] = useState(false);
  const s = { fontFamily:"'Montserrat',sans-serif", minHeight:"100vh", background:"#f9f9f7", color:"#1a1a1a" };

  const isSubscribed = user?.publicMetadata?.subscribed === true;

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error(err); }
    setSubscribing(false);
  };

  if (!isLoaded) return (
    <div style={{...s, display:"flex", alignItems:"center", justifyContent:"center"}}>
      <div style={{fontSize:13, color:"#999"}}>Loading...</div>
    </div>
  );

  if (!isSignedIn) return (
    <div style={{...s, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:20, padding:20}}>
      <div style={{textAlign:"center", marginBottom:8}}>
        <div style={{fontSize:28, fontWeight:700, fontFamily:"'League Spartan',sans-serif", letterSpacing:1}}>Make My Pin</div>
        <div style={{fontSize:13, color:"#888", marginTop:4}}>Create beautiful Pinterest pins in seconds</div>
      </div>
      {authScreen === "signin" ? <SignIn afterSignInUrl="/" /> : <SignUp afterSignUpUrl="/" />}
      <div style={{fontSize:12, color:"#888"}}>
        {authScreen === "signin"
          ? <span>Don't have an account? <button onClick={()=>setAuthScreen("signup")} style={{background:"none",border:"none",color:"#1a56ff",cursor:"pointer",fontSize:12,fontWeight:600}}>Sign up</button></span>
          : <span>Already have an account? <button onClick={()=>setAuthScreen("signin")} style={{background:"none",border:"none",color:"#1a56ff",cursor:"pointer",fontSize:12,fontWeight:600}}>Sign in</button></span>
        }
      </div>
    </div>
  );

  if (!isSubscribed) return (
    <div style={{...s, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:24, padding:20, textAlign:"center"}}>
      <div style={{fontSize:28, fontWeight:700, fontFamily:"'League Spartan',sans-serif", letterSpacing:1}}>Make My Pin</div>
      <div style={{background:"#fff", borderRadius:16, padding:"32px 28px", maxWidth:380, width:"100%", boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
        <div style={{fontSize:18, fontWeight:700, marginBottom:8}}>Start Creating</div>
        <div style={{fontSize:13, color:"#888", marginBottom:24, lineHeight:1.6}}>Get unlimited access to all 5 templates and create beautiful Pinterest pins in seconds.</div>
        <div style={{fontSize:32, fontWeight:900, fontFamily:"'League Spartan',sans-serif", marginBottom:4}}>$9.99<span style={{fontSize:14, fontWeight:400, color:"#888"}}>/month</span></div>
        <div style={{fontSize:12, color:"#aaa", marginBottom:24}}>Cancel anytime</div>
        <button onClick={handleSubscribe} disabled={subscribing}
          style={{width:"100%", background:"#1a1a1a", color:"#fff", border:"none", borderRadius:10, padding:"14px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'League Spartan',sans-serif", letterSpacing:1}}>
          {subscribing ? "Loading..." : "Subscribe Now →"}
        </button>
      </div>
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        <UserButton afterSignOutUrl="/" />
        <span style={{fontSize:12, color:"#aaa"}}>Signed in as {user?.primaryEmailAddress?.emailAddress}</span>
      </div>
    </div>
  );

  if (screen === "select") return (
    <div style={s}>
      <div style={{padding:"24px 20px 16px", borderBottom:"1px solid #eee", background:"#fff", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:22, fontWeight:700, fontFamily:"'League Spartan',sans-serif", letterSpacing:1}}>Make My Pin</div>
          <div style={{fontSize:13, color:"#888", marginTop:4}}>Choose a template to get started</div>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
      <div style={{padding:20}}>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:12, maxWidth:700, margin:"0 auto"}}>
          {TEMPLATES.map(t => <TemplateThumb key={t.id} tid={t.id} onClick={()=>openTemplate(t.id)} />)}
        </div>
      </div>
    </div>
  );

  return (
    <div style={s}>
      <div style={{padding:"12px 16px", borderBottom:"1px solid #eee", background:"#fff", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          <button onClick={()=>setScreen("select")} style={{background:"none",border:"1px solid #ddd",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",color:"#666"}}>← Templates</button>
          <span style={{fontSize:14,fontWeight:600,fontFamily:"'League Spartan',sans-serif"}}>{TEMPLATES.find(t=>t.id===template)?.name}</span>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>

      <div style={{display:"flex", flexDirection: isMobile ? "column" : "row", gap:0}}>

        {/* Controls */}
        <div style={{width:"100%", maxWidth: isMobile ? "100%" : 280, padding:16, order: isMobile ? 2 : 1, borderRight: isMobile ? "none" : "1px solid #eee", borderTop: isMobile ? "1px solid #eee" : "none", background:"#fff", display:"flex", flexDirection:"column", gap:14}}>

          {/* Photo uploads */}
          {["basic","box","seethrough"].includes(template) && (
            <div>
              <div style={{fontSize:10,letterSpacing:3,color:"#999",textTransform:"uppercase",marginBottom:6,fontWeight:500}}>Photo</div>
              <label style={{display:"block",border:"1.5px dashed #ddd",borderRadius:8,padding:14,textAlign:"center",cursor:"pointer",background:"#fafafa"}}>
                <div style={{fontSize:20}}>↑</div>
                <div style={{fontSize:11,color:"#999",marginTop:3}}>{state.img ? "✓ Loaded · drag to reposition" : "Tap to upload"}</div>
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0],"img")} />
              </label>
            </div>
          )}

          {template==="split" && (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {["Top Photo","Bottom Photo"].map((label,i) => (
                <div key={i}>
                  <div style={{fontSize:10,letterSpacing:3,color:"#999",textTransform:"uppercase",marginBottom:6,fontWeight:500}}>{label}</div>
                  <label style={{display:"block",border:"1.5px dashed #ddd",borderRadius:8,padding:10,textAlign:"center",cursor:"pointer",background:"#fafafa"}}>
                    <div style={{fontSize:11,color:"#999"}}>{(i===0?state.img1:state.img2) ? "✓ Loaded" : "↑ Tap to upload"}</div>
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0],i===0?"img1":"img2")} />
                  </label>
                </div>
              ))}
            </div>
          )}

          {template==="quad" && (
            <div>
              <div style={{fontSize:10,letterSpacing:3,color:"#999",textTransform:"uppercase",marginBottom:8,fontWeight:500}}>4 Photos</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {["Top Left","Top Right","Bot Left","Bot Right"].map((label,i) => (
                  <label key={i} style={{display:"block",border:"1.5px dashed #ddd",borderRadius:8,padding:8,textAlign:"center",cursor:"pointer",background:"#fafafa"}}>
                    <div style={{fontSize:9,color:"#aaa",marginBottom:2,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
                    <div style={{fontSize:11,color:"#999"}}>{state.imgs[i] ? "✓" : "↑ Upload"}</div>
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0],"",true,i)} />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Text fields */}
          {template==="basic" && <>
            <Field label="Site / Blog Name" optional value={state.site} onChange={v=>updateState("site",v)} placeholder="e.g. makemypin.com" />
            <Field label="Main Headline" value={state.headline} onChange={v=>updateState("headline",v)} placeholder="e.g. 10 Things to Do in Bali" textarea />
            <Field label="Subtitle" optional value={state.subtitle} onChange={v=>updateState("subtitle",v)} placeholder="e.g. Travel Guide" />
          </>}
          {template==="box" && <>
            <Field label="Site / Blog Name" optional value={state.site} onChange={v=>updateState("site",v)} placeholder="e.g. makemypin.com" />
            <Field label="Box 1 — Prefix" value={state.prefix} onChange={v=>updateState("prefix",v)} placeholder="e.g. 5 Things" />
            <Field label="Box 2 — Main Text" value={state.main} onChange={v=>updateState("main",v)} placeholder="e.g. To Do in Rome" textarea />
            <Field label="Box 3 — Location" value={state.location} onChange={v=>updateState("location",v)} placeholder="e.g. Italy" />
          </>}
          {template==="seethrough" && <>
            <Field label="Main Title" value={state.title} onChange={v=>updateState("title",v)} placeholder="e.g. Ultimate Guide to Kathmandu" textarea />
            <Field label="Site / Blog Name" optional value={state.site} onChange={v=>updateState("site",v)} placeholder="e.g. makemypin.com" />
          </>}
          {template==="split" && <>
            <Field label="Subtitle" value={state.subtitle} onChange={v=>updateState("subtitle",v)} placeholder="e.g. 10 Reasons to Visit" />
            <Field label="Main Text" value={state.main} onChange={v=>updateState("main",v)} placeholder="e.g. Krakow" textarea />
            <Field label="Site / Blog Name" optional value={state.site} onChange={v=>updateState("site",v)} placeholder="e.g. makemypin.com" />
          </>}
          {template==="quad" && <>
            <Field label="Top Text" value={state.topText} onChange={v=>updateState("topText",v)} placeholder="e.g. Bahamas" />
            <Field label="Main Title" value={state.mainText} onChange={v=>updateState("mainText",v)} placeholder="e.g. Travel Guide" />
            <Field label="Site / Blog Name" optional value={state.site} onChange={v=>updateState("site",v)} placeholder="e.g. makemypin.com" />
          </>}

          {/* Color combos */}
          <div>
            <div style={{fontSize:10,letterSpacing:3,color:"#999",textTransform:"uppercase",marginBottom:8,fontWeight:500}}>Color</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
              {COMBOS.map((c,i) => (
                <button key={i} onClick={()=>setCombo(c)} title={c.name}
                  style={{background:c.box, color:c.text, border:`2px solid ${combo===c?"#333":c.border}`,
                    borderRadius:6, padding:"5px 2px", cursor:"pointer", fontSize:8, fontWeight:600,
                    transform:combo===c?"scale(1.1)":"scale(1)", transition:"all 0.15s"}}>
                  {c.name.substring(0,4)}
                </button>
              ))}
            </div>
          </div>

          {/* Fonts */}
          <div>
            <div style={{fontSize:10,letterSpacing:3,color:"#999",textTransform:"uppercase",marginBottom:8,fontWeight:500}}>Font</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              {FONTS.map((f,i) => (
                <button key={i} onClick={()=>{ document.fonts.load(`900 16px ${f.stack}`).then(()=>setFont(f)); }}
                  style={{background:font===f?"#1a1a1a":"#f5f5f5", color:font===f?"#fff":"#444",
                    border:"1px solid #ddd", borderRadius:6, padding:"7px 4px", cursor:"pointer",
                    fontSize:10, fontFamily:f.stack, transition:"all 0.15s"}}>
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <button onClick={download}
            style={{background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,padding:"13px",
              fontSize:12,fontWeight:600,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",
              fontFamily:"'League Spartan',sans-serif"}}>
            ↓ Download Pin
          </button>
        </div>

        {/* Canvas - always rendered, order changes on mobile */}
        <div style={{flex:1, order: isMobile ? 1 : 2, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding: isMobile ? "16px 16px 0" : 20, gap:8, minWidth:0, background: isMobile ? "#f9f9f7" : "transparent"}}>
          <canvas ref={canvasRef} width={W} height={H}
            style={{borderRadius:12, display:"block", boxShadow:"0 8px 40px rgba(0,0,0,0.15)", cursor: repositionMode ? "grab" : "default", width:"100%", maxWidth: isMobile ? "340px" : "400px", height:"auto",
              outline: repositionMode ? "3px solid #1a56ff" : "none"}}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp} />
          {isMobile && (
            <button
              onClick={() => setRepositionMode(r => !r)}
              style={{
                background: repositionMode ? "#1a56ff" : "#f0f0f0",
                color: repositionMode ? "#fff" : "#444",
                border: "none", borderRadius: 8, padding: "8px 18px",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Montserrat',sans-serif",
              }}>
              {repositionMode ? "✓ Done Repositioning" : "⟳ Reposition Photo"}
            </button>
          )}
          {!isMobile && <p style={{fontSize:11,color:"#aaa"}}>Drag photo to reposition</p>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, optional, textarea }) {
  const labelStyle = {fontSize:10,letterSpacing:3,color:"#999",textTransform:"uppercase",marginBottom:6,fontWeight:500};
  const inputStyle = {width:"100%",background:"#fafafa",border:"1px solid #eee",borderRadius:8,padding:"8px 10px",fontSize:12,fontFamily:"'Montserrat',sans-serif",outline:"none",color:"#1a1a1a"};
  return (
    <div>
      <div style={labelStyle}>{label}{optional && <span style={{fontSize:9,color:"#bbb",marginLeft:5,letterSpacing:1}}>OPTIONAL</span>}</div>
      {textarea
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={2} style={{...inputStyle,resize:"vertical",lineHeight:1.5}} />
        : <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={80} style={inputStyle} />
      }
    </div>
  );
}
