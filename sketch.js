// Files needed next to this sketch (served over http:// — VS Code Live Server is fine):
//   UTK_Route.geojson    – the route (LineString / MultiLineString)
//   UTK_Points.geojson    – the video points (Point or MultiPoint; empty features skipped)
//   Vids_p5/1.mp4 ..      – one clip per point, matched by order (1st point -> 1.mp4)
//
// White ground, light-grey grid, Union Jack blue + red. Points are small portrait
// rectangles; the video frame links to its point by two sight lines. Flat 2D timeline.

const ROUTE_FILE  = 'UTK_Route_New.geojson';
const POINTS_FILE = 'Video_positions.geojson';
const VIDEO_DIR   = 'CSV_Videos/';   // folder holding the {id}.mp4 clips (must match exactly)
const MAP_FILE    = 'map_image2.png'; // basemap exported from QGIS (EPSG:7405)

// basemap geographic extent (BNG metres), from map_image.pgw
const MAP_MINX = 529660.4693, MAP_MAXX = 530859.5843;
const MAP_MINY = 179484.2842, MAP_MAXY = 182672.9419;

const PAD = 40;
const TRACK_INSET = 64;
const GAP = 75;
const ACTIVE_FRACTION = 0.02;
const START_DEADZONE  = 0.01;      // top of the track is neutral — nothing plays while parked here
const BOX_INSET = 100;              // (legacy) how far the video frame sits from the left edge
const FRAME_MAP_GAP = 75;          // frame's right edge sits this far left of the map image
const VIDEO_SCALE   = 0.75;         // clip long side = this fraction of the map height (portrait & landscape)

// ---- palette ----
const BG        = '#ffffff';
const GRID_MIN  = '#eef0f3';
const GRID_MAJ  = '#e2e6ea';
const ROUTE_DIM = '#c6ccd4';
const GREY      = '#aab2bd';
const BLUE      = '#012169';        // Union Jack blue  – path / structure
const RED       = '#c8102e';        // Union Jack red   – cursor / active / evidence

// left time-axis + caption layout
const TIME_GAP     = 75;            // time axis sits this far left of the scrubber (between scrubber and map)
const AXIS_TOP_MIN = 540;           // 9:00 AM  -> top of the axis
const AXIS_BOT_MIN = 1439;          // 11:59 PM -> bottom of the axis
const CAPTION_W    = 500;              // caption wrap width
const CAPTION_PAD  = 10;               // padding inside the red caption box

// post metadata keyed by CSV VID NUMBER (= point id): { time, mins, caption }
const VIDEO_META = {"6": {"time": "11:34 PM", "mins": 1414, "caption": "Safely arrived home.\nWhat a beautiful experience.\n#UniteTheKingdom"}, "12": {"time": "10:27 PM", "mins": 1347, "caption": "Been a good day in London \u2764\ufe0f #UniteTheKingdom \ud83c\uddec\ud83c\udde7"}, "33": {"time": "8:56 PM", "mins": 1256, "caption": "\u201cHardly anyone was at this new Tommy Robinson rally\u201d\u2026\n\n\u2026 yup, no body showed up (allegedly) \ud83d\ude02, and people were shoulder to shoulder walking down that road for hours. \ud83e\udee1\ud83c\uddec\ud83c\udde7\n\n#UTK\n#UniteTheKingdom"}, "34": {"time": "8:46 PM", "mins": 1246, "caption": "#Unitethekingdom"}, "36": {"time": "8:14 PM", "mins": 1214, "caption": "Where the true flags are raised, there you can find the truth and peace.\n\nIranian and British patriots stand together for their homeland, for their country.\n\nMake Iran Great Again.\nUnite The Kingdom.\n\n\ud83c\uddee\ud83c\uddf7\ud83c\uddee\ud83c\uddf1\ud83c\uddec\ud83c\udde7\n\n#KingRezaPahlavi\u200cForIran \n#UniteTheKingdom"}, "44": {"time": "7:53 PM", "mins": 1193, "caption": "#unitethekingdom"}, "50": {"time": "7:39 PM", "mins": 1179, "caption": "#UnitetheKingdom"}, "51": {"time": "7:37 PM", "mins": 1177, "caption": "I don't know this couple but check out those bags. Kudos. \ud83d\udc4f\ud83c\udffb\n#UniteTheKingdom #UTK"}, "52": {"time": "7:24 PM", "mins": 1164, "caption": "#utk #unitethekingdom  \n@TRobinsonNewEra\n  well done everyone \ud83d\udcaa"}, "53": {"time": "7:21 PM", "mins": 1161, "caption": "Proud of Our Joint History \nas Christian Nations\n\nAmerican broadcaster Glenn Beck addresses the huge crowds at the #UniteTheKingdom rally outside the Palace of Westminster"}, "56": {"time": "7:10 PM", "mins": 1150, "caption": "Tommy Robinson had promised that millions will attend his Unite the Kingdom rally but only a few thousands showed up - as compared to his last year\u2019s rally attended by over 100,000 in London #unitethekingdom #nakbahday"}, "62": {"time": "6:53 PM", "mins": 1133, "caption": "#UniteTheKingdom #RestoreBritain \ud83c\uddec\ud83c\udde7\ud83c\uddee\ud83c\uddea\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc73\udb40\udc63\udb40\udc74\udb40\udc7f\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc77\udb40\udc6c\udb40\udc73\udb40\udc7f"}, "68": {"time": "6:47 PM", "mins": 1127, "caption": "Say what he like about \n@TRobinsonNewEra\n but he stood by Iranians when most British politicians didn\u2019t \n\n#FreeIran\u200c \n#UniteTheKingdom"}, "87": {"time": "6:05 PM", "mins": 1085, "caption": "No slogans. No slurs. No calls for death. No hatred. No calls for the eradication of any nation. No chants against any religion. Just people united under one flag, proudly displaying patriotism, heritage, and love for their country. Unite the Kingdom #unitethekingdom"}, "89": {"time": "6:00 PM", "mins": 1080, "caption": "@TRobinsonNewEra\n and everyone u did us proud I see no hate just love #unitethekingdom"}, "95": {"time": "5:50 PM", "mins": 1070, "caption": "A day of peaceful protest, hope and song.  Protect #freedom of speech #UniteTheKingdom"}, "98": {"time": "5:46 PM", "mins": 1066, "caption": "So proud to be an Iranian!\n#UniteTheKingdom"}, "100": {"time": "5:44 PM", "mins": 1064, "caption": "This is the final battle, Pahlavi will return home. \n\nLondon, 16 May, Unite the Kingdom Rally \n\n#KingRezaPahlavi\u200cForIran\n#UnitetheKingdom"}, "110": {"time": "5:19 PM", "mins": 1039, "caption": "Tommy Robinson speaks out on Parliament Square during his #UniteTheKingdom rally, and Whitehall is almost completely deserted."}, "113": {"time": "5:09 PM", "mins": 1029, "caption": "The Main Man \ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc65\udb40\udc6e\udb40\udc67\udb40\udc7f\ud83c\uddec\ud83c\udde7\n#UniteTheKingdom \n@TRobinsonNewEra"}, "121": {"time": "4:49 PM", "mins": 1009, "caption": "\ud83c\uddec\ud83c\udde7\ud83c\uddec\ud83c\udde7\ud83c\uddec\ud83c\udde7 Amazing Day \ud83c\uddec\ud83c\udde7\ud83c\uddec\ud83c\udde7\ud83c\uddec\ud83c\udde7\n#unitethekingdom \n#UTK \n\ud83d\udc4d"}, "140": {"time": "4:09 PM", "mins": 969, "caption": "An unemployed wanker soon\n#utk #unitethekingdom"}, "145": {"time": "4:04 PM", "mins": 964, "caption": "Wow\u2026 \ud83d\ude2e there might be much more than last time\u2026 \ud83d\udcaa\ud83c\udffb\ud83d\udcaa\ud83c\udffb\n\nOrders of magnitude more than the 50,000 the traitor media people said \ud83d\ude02\n\n#UTK\n#UniteTheKingdom"}, "153": {"time": "3:56 PM", "mins": 956, "caption": "Enjoying a wonderful spot of racist music at #unitethekingdom #utk"}, "168": {"time": "3:36 PM", "mins": 936, "caption": "Thanks to \n@daveatherton\n for sharing with us! #unitethekingdom"}, "179": {"time": "3:14 PM", "mins": 914, "caption": "#unitethekingdom"}, "182": {"time": "2:57 PM", "mins": 897, "caption": "London Now\n\nMajestic Gathering of British and Iranian Patriots\n \ud83c\uddee\ud83c\uddf7\u270c\ud83c\udffc\ud83c\uddec\ud83c\udde7\n\n#UniteTheKingdom"}, "183": {"time": "2:57 PM", "mins": 897, "caption": "What a beautiful sight \ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc65\udb40\udc6e\udb40\udc67\udb40\udc7f #UniteTheKingdom \n@TRobinsonNewEra\n x"}, "185": {"time": "2:41 PM", "mins": 881, "caption": "@Keir_Starmer\n is this the far right ur talking about i see nothing but love #unitethekingdom #kierstarmer \n@TRobinsonNewEra"}, "187": {"time": "2:38 PM", "mins": 878, "caption": "The fact of seeing so many people unite around shared convictions highlights just how important issues of identity and orientation are for many citizens today. #UniteTheKingdom #NationalUnity #FutureOfBritain \u2764\ufe0f"}, "189": {"time": "2:25 PM", "mins": 865, "caption": "Passed through #UniteTheKingdom as it\u2019s on my way to the spa\u2026\n\nA Bob Marley song is currently playing. The vibe is actually similar to the Notting Hill Carnival, just British instead of Afro-Caribbean.\n\nI smell weed, see some dilated pupils, lots of booze, cheerful singing and chants of \u201cKeir Starmer\u2019s a wanker\u201d\n\nMostly white, some black and brown faces. Not threatening at all at present. Hope it stays this way\u2026"}, "195": {"time": "2:16 PM", "mins": 856, "caption": "Finally at Parliament Square \ud83e\udee1\ud83c\uddec\ud83c\udde7\nAnd the Patriots keep coming \ud83d\ude32\ud83d\udc4c\ud83c\udffb\n\n\u2026 and that\u2019s me.\nOff for a pint (or 3) and a few packs of pork scratchings. \ud83d\udcaa\ud83c\udffb\n\n#UTK #UniteTheKingdom"}, "197": {"time": "2:11 PM", "mins": 851, "caption": "#UniteTheKingdom #UTK \ud83c\uddec\ud83c\udde7"}, "201": {"time": "1:58 PM", "mins": 838, "caption": "London Right Now\n\nA gathering of British and Iranian patriots, accompanied by the Lion and Sun flag of Iran and an image of Reza Shah II.\n\n#UniteTheKingdom"}, "204": {"time": "1:46 PM", "mins": 826, "caption": "Playing Ghost Town at the #UniteTheKingdom rally when there\u2019s literally nobody there! \n\nOh the IRONY! \ud83e\udd23\ud83e\udd23\ud83e\udd23\ud83e\udd23\ud83e\udd23"}, "205": {"time": "1:46 PM", "mins": 826, "caption": "Beautiful People. \ud83e\udd70\ud83e\udd70\ud83e\udd70\n\n#UniteTheKingdom #UTK #FourNationsOneKingdom"}, "215": {"time": "1:33 PM", "mins": 813, "caption": "Wow \ud83e\udd29\n\n\ud83c\udfb5 Sweet Caroline wah wah wah \ud83c\udfb6\n\n\ud83e\udee1\ud83c\uddec\ud83c\udde7 #UTK #UniteTheKingdom"}, "220": {"time": "1:20 PM", "mins": 800, "caption": "London Right Now\n\nPatriotic Iranians residing in Britain supporting Tommy Robinson's call with the national Lion and Sun flag of Iran and an image of Reza Shah II.\n\n#UniteTheKingdom"}, "222": {"time": "1:16 PM", "mins": 796, "caption": "#unitethekingdom Here we go! The march has started \ud83c\uddec\ud83c\udde7"}, "227": {"time": "1:11 PM", "mins": 791, "caption": "Unite the Kingdom.\nLondon.\nCome and join us.\n#UnitetheKingdom"}, "230": {"time": "1:07 PM", "mins": 787, "caption": "Here we go\u2026 \ud83d\udc4c\ud83c\udffb\ud83c\uddec\ud83c\udde7\nOn the move.\n\n#UTK #UniteTheKingdom"}, "243": {"time": "12:51 PM", "mins": 771, "caption": "Thousands are gathering in London ahead of Tommy Robinson's march, which is set to take off at 1pm  \n\n#UniteTheKingdom #UTK #FourNationsOneKingdom"}, "244": {"time": "12:51 PM", "mins": 771, "caption": "#UniteTheKingdom , in the UK people are taking to the streets en masse to take the country back from the globalist politicians. They too are fed up with #immigration , replacement \ud83d\udcaa\u2764\ufe0f #StarmerOut"}, "245": {"time": "12:51 PM", "mins": 771, "caption": "What a wonderful sight. #UTK #UniteTheKingdom"}, "248": {"time": "12:48 PM", "mins": 768, "caption": "London will be British.  \n\n#UniteTheKingdom #UTK #FourNationsOneKingdom"}, "260": {"time": "12:14 PM", "mins": 734, "caption": "#unitethekingdom \n\nAt the unite the kingdom march with a sea of patriots. The atmosphere is off the scale. Looking forward to hearing \n@officialsammyuk\n later \ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc65\udb40\udc6e\udb40\udc67\udb40\udc7f\ud83d\udcaa\ud83c\udffb"}, "265": {"time": "12:11 PM", "mins": 731, "caption": "UTK march, Kier Starmer is a wanker\n\n#UniteTheKingdom\n#UK\n#UTK \n#London"}, "286": {"time": "11:49 AM", "mins": 709, "caption": "#UniteTheKingdom A busy turnout and it's only the start."}, "312": {"time": "10:58 AM", "mins": 658, "caption": "The number of people here is staggering\u2026 and I was at the first (Sept 13th 2025) #UTK #UniteTheKingdom march. \ud83d\udcaa\ud83c\udffb\n\n\ud83e\udee1\ud83c\uddec\ud83c\udde7 - Unite The Kingdom 2 looks like even more people\u2026 and it\u2019s only 10:30am - 30 minutes before the start."}, "325": {"time": "10:13 AM", "mins": 613, "caption": "1 hour before #UTK #UniteTheKingdom officially begins\u2026 and now BOTH sides of the street are at bursting point \ud83d\udcaa\ud83c\udffb\n\nPeople from all over the country, all ages, ethnicities and cultures, Brits and non-Brits - all patriots \u2764\ufe0f\ud83c\uddec\ud83c\udde7"}, "328": {"time": "10:04 AM", "mins": 604, "caption": "Male and Female, Black and White, Old and Young\u2026 The voice of the people Mr Starmer..\n#UTK #unitethekingdom #Britainfirst"}, "336": {"time": "9:40 AM", "mins": 580, "caption": "#UniteTheKingdom\n#UTK - 9:30am\u2026 already over 1000 patriots here \ud83e\udee1\ud83c\uddec\ud83c\udde7\n\nIt doesn\u2019t start officially until 11:00am"}, "341": {"time": "9:28 AM", "mins": 568, "caption": "It has begun\u2026\n#UTK #unitethekingdom #Britainfirst"}};

let geo = [];
let path = [];
let cum = [];
let total = 0;
let u = 0;
let dragging = false;

let pts = [];
let activePoint = null;

let T = null;
let trackX, trackTop, trackBot, timeX;
let basemap = null;
let imgRect = null;     // where the basemap is drawn, in pixels

async function setup() {
  createCanvas(1100, 700);     // <- swap for createCanvas(800,600) for a fixed size

  basemap = await loadImage(MAP_FILE);
  const route = await loadJSON(ROUTE_FILE);
  geo = route.features[0].geometry.coordinates[0]; // MultiLineString -> first (only) line

  const pj = await loadJSON(POINTS_FILE);
  pts = [];
  for (const f of pj.features) {
    const g = f.geometry || {};
    let coord = null;
    if (g.type === 'Point') coord = g.coordinates;
    else if (g.type === 'MultiPoint' && g.coordinates.length) coord = g.coordinates[0];
    if (!coord || coord.length < 2) continue;   // skip empty / malformed features

    const id = (f.properties || {}).id;          // video file is named after this id
    if (id == null) continue;                    // no id -> no way to find a clip
    const name = VIDEO_DIR + id + '.mp4';         // e.g. id 33 -> CSV_Videos/33.mp4
    const p = { id, gx: coord[0], gy: coord[1], name, vid: null, x: 0, y: 0, dist: 0 };
    p.vid = createVideo(name);
    p.vid.hide();
    p.vid.elt.loop = true;
    p.vid.elt.preload = 'none';      // don't download until the scrubber lands on this point
    p.vid.pause();
    pts.push(p);
  }

  layout();
}

function windowResized() {
  resizeCanvas(1000, 700);
  if (geo.length) layout();
}

function geoToPx(x, y) {
  return [T.offX + (x - T.minX) * T.s, T.offY + (T.maxY - y) * T.s];
}

function layout() {
  trackX   = TRACK_INSET;              // scrubber on the LEFT
  trackTop = PAD;
  trackBot = height - PAD;
  timeX    = trackX + TIME_GAP;        // time axis just right of the scrubber

  const areaY = PAD;
  const areaLeft = timeX + GAP;        // map sits GAP to the right of the time axis
  const areaW = (width - PAD) - areaLeft;
  const areaH = height - 2 * PAD;

  // transform is driven by the basemap's extent, so the route + points land on the map
  const mW = MAP_MAXX - MAP_MINX, mH = MAP_MAXY - MAP_MINY;
  const s = min(areaW / mW, areaH / mH);
  const drawW = mW * s, drawH = mH * s;
  const offX = areaLeft;                      // anchor the map's LEFT edge near the time axis
  const offY = areaY + (areaH - drawH) / 2;   // centre vertically

  T = { minX: MAP_MINX, maxY: MAP_MAXY, s, offX, offY };
  imgRect = { x: offX, y: offY, w: drawW, h: drawH };

  path = geo.map(([x, y]) => geoToPx(x, y));
  cum[0] = 0;
  for (let i = 1; i < path.length; i++) cum[i] = cum[i - 1] + dist(...path[i - 1], ...path[i]);
  total = cum[cum.length - 1];

  for (const p of pts) {
    [p.x, p.y] = geoToPx(p.gx, p.gy);
    p.dist = projectOntoRoute(p.x, p.y).dist;
  }
}

// ============================ DRAW ============================

function draw() {
  background(BG);
  if (!path.length) return;
  rectMode(CENTER);

  if (basemap && imgRect) image(basemap, imgRect.x, imgRect.y, imgRect.w, imgRect.h);
  drawTimeAxis();

  // frame + beam appear only once the active clip actually has a frame to show
  const ready = activePoint && activePoint.vid.elt.readyState >= 2;
  const r = ready ? videoRect(activePoint) : null;
  if (ready) drawSightBeam(activePoint, r);

  drawRouteBase();
  drawRouteTravelled(u * total);
  drawEndMarks();

  for (const p of pts) if (p !== activePoint) drawMarker(p.x, p.y, false);
  if (activePoint) drawMarker(activePoint.x, activePoint.y, true);

  const [mx, my] = pointAtDistance(u * total);
  drawDot(mx, my, 10, RED);                     // route playhead

  if (activePoint) drawActiveMeta(activePoint);

  if (ready) drawVideoFrame(activePoint, r);

  drawTrack();
}

function drawRouteBase() {
  noFill(); stroke(ROUTE_DIM); strokeWeight(1.5);
  beginShape();
  for (const [px, py] of path) vertex(px, py);
  endShape();
}

function drawRouteTravelled(d) {
  noFill(); stroke(BLUE); strokeWeight(2);
  beginShape();
  vertex(path[0][0], path[0][1]);
  let i = 0;
  while (i < path.length - 1 && cum[i + 1] < d) { i++; vertex(path[i][0], path[i][1]); }
  const [mx, my] = pointAtDistance(d);
  vertex(mx, my);
  endShape();
}

function drawEndMarks() {
  noFill(); stroke(GREY); strokeWeight(1);
  rect(path[0][0], path[0][1], 9, 9);
  rect(path[path.length - 1][0], path[path.length - 1][1], 9, 9);
}

// small portrait rectangle marker (taller than wide)
function drawMarker(x, y, active) {
  if (active) {
    noStroke();
    fill(RED);
    rect(x, y, 8, 13);
  } else {
    stroke(1, 33, 105, 160);     // thin blue outline
    strokeWeight(0.75);
    fill(1, 33, 105, 70);        // translucent blue — overlaps build up to show density
    rect(x, y, 6, 10);
  }
}

// small filled circle (route playhead + timeline handle)
function drawDot(x, y, d, col) {
  noStroke(); fill(col);
  circle(x, y, d);
}

function videoRect(p) {
  const vw = p.vid.elt.videoWidth || 16, vh = p.vid.elt.videoHeight || 9;
  const leftX   = imgRect.x + imgRect.w + FRAME_MAP_GAP;  // bottom-left corner x: right of the map
  const bottomY = imgRect.y + imgRect.h;                  // shared bottom-left corner y = map bottom edge

  const s = imgRect.h * VIDEO_SCALE / max(vw, vh);    // longer side == 75% of map height
  const w = vw * s, h = vh * s;
  return { x: leftX, y: bottomY - h, w, h };          // all clips share the bottom-left corner (grow up & right)
}

function drawSightBeam(p, r) {
  const tlX = r.x, tlY = r.y;                  // top-left corner of the frame
  const blX = r.x, blY = r.y + r.h;            // bottom-left corner

  noStroke(); fill('rgba(200,16,46,0.07)');
  beginShape();
  vertex(tlX, tlY); vertex(p.x, p.y); vertex(blX, blY);
  endShape(CLOSE);

  stroke(RED); strokeWeight(1);
  line(tlX, tlY, p.x, p.y);
  line(blX, blY, p.x, p.y);
}

function drawVideoFrame(p, r) {
  if (p.vid.width > 0) image(p.vid, r.x, r.y, r.w, r.h);
  else { noStroke(); fill('#eef0f3'); rect(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h); }

  noFill(); stroke(GREY); strokeWeight(1);
  rect(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h);

  const L = 16;
  stroke(RED); strokeWeight(2); noFill();
  line(r.x, r.y, r.x + L, r.y);                 line(r.x, r.y, r.x, r.y + L);
  line(r.x + r.w, r.y, r.x + r.w - L, r.y);     line(r.x + r.w, r.y, r.x + r.w, r.y + L);
  line(r.x, r.y + r.h, r.x + L, r.y + r.h);     line(r.x, r.y + r.h, r.x, r.y + r.h - L);
  line(r.x + r.w, r.y + r.h, r.x + r.w - L, r.y + r.h);
  line(r.x + r.w, r.y + r.h, r.x + r.w, r.y + r.h - L);
}

// ---- left time axis (9 AM top .. 11:59 PM bottom) ----
function timeY(mins) {
  const f = constrain((mins - AXIS_TOP_MIN) / (AXIS_BOT_MIN - AXIS_TOP_MIN), 0, 1);
  return lerp(trackTop, trackBot, f);
}

function drawTimeAxis() {
  stroke(GREY); strokeWeight(1); noFill();
  line(timeX, trackTop, timeX, trackBot);

  // every tweet's post time, in the same style as the scrubber ticks
  for (const p of pts) {
    const meta = VIDEO_META[p.id];
    if (!meta || meta.mins == null) continue;
    const ty = timeY(meta.mins);
    const on = (p === activePoint);
    stroke(on ? RED : BLUE);
    strokeWeight(on ? 1.5 : 1);
    const t = on ? 9 : 6;
    line(timeX - t, ty, timeX + t, ty);
  }

  noStroke(); fill(GREY); textSize(11);
  textAlign(CENTER, BOTTOM); text('9 AM', timeX, trackTop - 6);
  textAlign(CENTER, TOP);    text('11:59 PM', timeX, trackBot + 6);
}

// wrap a caption to a pixel width: honours existing line breaks, wraps long lines by word,
// and hard-breaks any single run that is itself wider than the box (long no-space strings)
function wrapLines(str, maxW) {
  const out = [];
  for (const para of String(str).split('\n')) {
    if (para.trim() === '') { out.push(''); continue; }
    let line = '';
    for (let word of para.split(/\s+/)) {
      while (textWidth(word) > maxW) {                 // break an over-long single run
        let chunk = '';
        for (const ch of word) {
          if (chunk && textWidth(chunk + ch) > maxW) break;
          chunk += ch;
        }
        if (line) { out.push(line); line = ''; }
        out.push(chunk);
        word = word.slice(chunk.length);
      }
      const test = line ? line + ' ' + word : word;
      if (textWidth(test) <= maxW) line = test;
      else { if (line) out.push(line); line = word; }
    }
    if (line) out.push(line);
  }
  return out;
}

function drawActiveMeta(p) {
  const meta = VIDEO_META[p.id];
  if (!meta) return;

  if (meta.mins != null) {                      // red link: scrubber -> time tick -> route point
    const scrubY = lerp(trackTop, trackBot, p.dist / total);
    const tY     = timeY(meta.mins);
    stroke(RED); strokeWeight(1.5); fill(BLUE);
    line(trackX, scrubY, timeX, tY);            // scrubber  -> time axis
    line(timeX, tY, p.x, p.y);                  // time axis -> point on the route
    noStroke(); fill(RED); textSize(11); textAlign(CENTER, BOTTOM);
    text(meta.time, timeX, tY - 12);            // the post time, above its tick
  }

  if (meta.caption) {                           // red-outlined box, fixed top-left, sized to the text
    push();
    rectMode(CORNER);
    textFont("Helvetica Neue");
    textWeight(550);
    textSize(12); textLeading(18);
    const pad = CAPTION_PAD, leading = 18;
    const boxLeft = imgRect.x + imgRect.w + FRAME_MAP_GAP;   // video's left edge (right of the map)
    const boxTop  = imgRect.y;                                               // line up with the map's top edge
    const lines = wrapLines(meta.caption, CAPTION_W);
    let maxW = 0;
    for (const ln of lines) maxW = max(maxW, textWidth(ln));
    const boxW = maxW + pad * 2;
    const boxH = lines.length * leading + pad * 2;

    // sight beam linking the video's bottom edge to the caption box's top edge
    const r = videoRect(p);
    const vbl = [r.x, r.y], vbr = [r.x, r.y];   // video bottom-left / -right
    const btl = [boxLeft, boxTop + boxH], btr = [boxLeft + boxW, boxTop + boxH]; // box top-left / -right
    noStroke(); fill('rgba(200,16,46,0.07)');
    beginShape();
    vertex(...vbl); vertex(...vbr); vertex(...btr); vertex(...btl);
    endShape(CLOSE);
    stroke(RED); strokeWeight(1); noFill();
    line(...vbl, ...btl);
    line(...vbr, ...btr);

    fill(255); stroke(RED); strokeWeight(1.5);
    rect(boxLeft, boxTop, boxW, boxH);

    noStroke(); fill(BLUE); textAlign(LEFT, TOP);
    for (let i = 0; i < lines.length; i++) {
      text(lines[i], boxLeft + pad, boxTop + pad + i * leading);
    }
    pop();
  }
}

function drawTrack() {
  noFill(); stroke(GREY); strokeWeight(1);
  line(trackX, trackTop, trackX, trackBot);

  for (const p of pts) {
    const ty = lerp(trackTop, trackBot, p.dist / total);
    const on = (p === activePoint);
    stroke(on ? RED : BLUE);
    strokeWeight(on ? 1.5 : 1);
    const t = on ? 9 : 6;
    line(trackX - t, ty, trackX + t, ty);
  }

  const hy = lerp(trackTop, trackBot, u);
  stroke(RED); strokeWeight(2.5);        // handle = grabbable horizontal line
  line(trackX - 16, hy, trackX + 16, hy);
}

// ============================ GEOMETRY / LOGIC ============================

function projectOntoRoute(px, py) {
  let bestD2 = Infinity;
  let res = { dist: 0, fx: px, fy: py, segDx: 1, segDy: 0 };
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i], [bx, by] = path[i + 1];
    const abx = bx - ax, aby = by - ay;
    const len2 = abx * abx + aby * aby;
    let t = len2 === 0 ? 0 : ((px - ax) * abx + (py - ay) * aby) / len2;
    t = constrain(t, 0, 1);
    const qx = ax + t * abx, qy = ay + t * aby;
    const dx = px - qx, dy = py - qy, d2 = dx * dx + dy * dy;
    if (d2 < bestD2) {
      bestD2 = d2;
      const segLen = sqrt(len2) || 1;
      res = { dist: cum[i] + t * (cum[i + 1] - cum[i]),
              fx: qx, fy: qy, segDx: abx / segLen, segDy: aby / segLen };
    }
  }
  return res;
}

function pointAtDistance(d) {
  d = constrain(d, 0, total);
  let i = 0;
  while (i < path.length - 1 && cum[i + 1] < d) i++;
  const segLen = cum[i + 1] - cum[i];
  const t = segLen === 0 ? 0 : (d - cum[i]) / segLen;
  return [lerp(path[i][0], path[i + 1][0], t),
          lerp(path[i][1], path[i + 1][1], t)];
}

function updateActive() {
  const scrubDist = u * total;
  const range = ACTIVE_FRACTION * total;
  let best = null, bestD = Infinity;
  if (u > START_DEADZONE) {                  // skip activation while parked at the very start
    for (const p of pts) {
      const d = abs(p.dist - scrubDist);
      if (d < range && d < bestD) { bestD = d; best = p; }
    }
  }
  if (best !== activePoint) {
    if (activePoint) activePoint.vid.elt.pause();
    activePoint = best;
    if (activePoint) {
      activePoint.vid.elt.currentTime = 0;
      const pr = activePoint.vid.elt.play();   // triggers the load now (preload was 'none')
      if (pr) pr.catch(() => {});
    }
  }
}

function setScrubFromMouse() {
  u = constrain((mouseY - trackTop) / (trackBot - trackTop), 0, 1);
  updateActive();
}
function mousePressed() {
  if (path.length && abs(mouseX - trackX) < 30 &&
      mouseY > trackTop - 20 && mouseY < trackBot + 20) {
    dragging = true;
    setScrubFromMouse();
  }
}
function mouseDragged() { if (dragging) setScrubFromMouse(); }
function mouseReleased() { dragging = false; }