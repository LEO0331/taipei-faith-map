import { useId } from 'react';
import type { SceneId } from './faithSpaceConfig';

/** Original architectural studies. These depict traditions, never a specific site. */
export function FaithSpaceIllustration({ scene }: { scene: SceneId }) {
  const id = useId().replace(/:/g, '');
  const palette = {
    taoist: ['#173c3b', '#dfb77d', '#ad4839'],
    buddhist: ['#344a3f', '#ead4a2', '#8f684b'],
    christian: ['#344c59', '#e7d7b2', '#956b4a'],
    catholic: ['#343650', '#e3c98d', '#956d53'],
    islamic: ['#194b4b', '#d9d3a5', '#8d9b7d'],
    generic: ['#3e5259', '#e4d8bf', '#9c8163'],
  }[scene];
  return (
    <svg className="faith-illustration" viewBox="0 0 900 600" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-wall`} x2="0" y2="1">
          <stop stopColor={palette[0]} /><stop offset="1" stopColor="#172b2d" />
        </linearGradient>
        <linearGradient id={`${id}-floor`} x2="0" y2="1">
          <stop stopColor={palette[2]} /><stop offset="1" stopColor="#263b3b" />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor={palette[1]} stopOpacity=".4" /><stop offset="1" stopColor={palette[1]} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-glass`} x2="1" y2="1">
          <stop stopColor="#d5dcc9" /><stop offset="1" stopColor="#819a94" />
        </linearGradient>
        <pattern id={`${id}-tiles`} width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M28 0 56 28 28 56 0 28Z M0 0 56 56 M56 0 0 56" fill="none" stroke="#e2d2a7" strokeOpacity=".25" />
        </pattern>
      </defs>
      <rect width="900" height="600" fill={`url(#${id}-wall)`} />
      <ellipse cx="450" cy="240" rx="430" ry="320" fill={`url(#${id}-light)`} />
      <path d="M0 408 450 346 900 408V600H0Z" fill={`url(#${id}-floor)`} />
      {scene === 'taoist' && <Taoist />}
      {scene === 'buddhist' && <Buddhist />}
      {scene === 'christian' && <Christian glass={`${id}-glass`} />}
      {scene === 'catholic' && <Catholic />}
      {scene === 'islamic' && <Islamic tiles={`${id}-tiles`} />}
      {scene === 'generic' && <Generic glass={`${id}-glass`} />}
      <path d="M0 584H900" stroke="#e7d0a2" strokeOpacity=".18" />
    </svg>
  );
}

function Taoist() {
  return <>
    <circle cx="713" cy="114" r="52" fill="#e1cb96" opacity=".2" />
    <path d="M0 283Q86 205 145 285V420H0ZM755 285Q822 204 900 280V420H755Z" fill="#29423a" />
    <path d="M0 331H900V403H0Z" fill="#b49c76" />
    <path d="M0 351H900M0 389H900" stroke="#d8c5a1" strokeWidth="5" />
    {[35, 89, 143, 757, 811, 865].map(x => <path key={x} d={`M${x} 350V389`} stroke="#716f57" strokeWidth="17" />)}
    <path d="M168 392V221H732V392Z" fill="#664236" />
    <path d="M208 386V248H692V386Z" fill="#2e3430" />
    {[263, 348, 552, 637].map(x => <g key={x} stroke="#b78d59" fill="none"><path d={`M${x - 28} 271h56v104h-56Z`} /><path d={`M${x - 22} 282l44 80m0-80-44 80M${x} 276v93`} strokeWidth="2" /></g>)}
    <path d="M404 252H496V386H404Z" fill="#1a2829" />
    <path d="M172 240H728V255H172Z" fill="#d9a366" />
    <path d="M115 215Q191 209 258 163L450 151 642 163Q709 209 785 215L753 235H147Z" fill="#304a46" stroke="#d9ae69" strokeWidth="6" />
    <path d="M159 213Q253 204 301 179H599Q647 204 741 213" fill="none" stroke="#72857a" strokeWidth="4" />
    {[244, 286, 328, 370, 412, 454, 496, 538, 580, 622, 664].map(x => <path key={x} d={`M450 162 ${x} 213`} stroke="#9fa38a" opacity=".35" />)}
    <path d="M238 157Q292 151 329 114L450 104 571 114Q608 151 662 157L640 176H260Z" fill="#3e5c52" stroke="#dbb779" strokeWidth="5" />
    <path d="M329 112Q310 93 316 79Q344 81 350 101M571 112Q590 93 584 79Q556 81 550 101" fill="none" stroke="#e2c88a" strokeWidth="5" />
    <path d="M426 103Q450 66 474 103" fill="none" stroke="#e4bd76" strokeWidth="5" />
    <circle cx="450" cy="83" r="8" fill="#c7583b" stroke="#e6c984" strokeWidth="3" />
    {[186, 374, 526, 714].map(x => <g key={x}><rect x={x - 9} y="248" width="18" height="146" fill="#b34536" /><rect x={x - 13} y="382" width="26" height="16" fill="#b8a989" /><path d={`M${x - 4} 260V370`} stroke="#df8060" strokeWidth="3" /></g>)}
    {[221, 679].map(x => <g key={x}><path d={`M${x} 238v24`} stroke="#d7b46e" strokeWidth="3" /><ellipse cx={x} cy="288" rx="23" ry="30" fill="#c8553b" stroke="#e6b66d" strokeWidth="3" /><path d={`M${x} 259q-15 29 0 58q15-29 0-58M${x - 20} 278h40m-40 19h40M${x} 319v23`} stroke="#e3a25c" fill="none" /><path d={`M${x - 5} 342h10`} stroke="#eac383" strokeWidth="4" /></g>)}
    <path d="M158 401H742L769 420H131Z" fill="#c2ae8a" />
    <path d="M131 421H769L794 440H106Z" fill="#8e8970" />
    <path d="M106 441H794L819 461H81Z" fill="#646e5c" />
    <path d="M266 461 191 600M634 461 709 600M450 461V600M0 521H900M0 570H900" stroke="#c6b48b" strokeOpacity=".25" />
    {[69, 831].map(x => <g key={x}><path d={`M${x - 23} 425q0-56 23-78q23 22 23 78Z`} fill="#4f6a50" /><rect x={x - 28} y="421" width="56" height="37" rx="4" fill="#8e7960" /></g>)}
  </>;
}

function Buddhist() {
  return <>
    <path d="M89 65H811V405H89Z" fill="#8b7352" />
    <path d="M118 91H782V393H118Z" fill="#b59b70" />
    <path d="M330 118H570V394H330Z" fill="#576854" />
    <circle cx="450" cy="242" r="110" fill="#d7c68b" opacity=".19" />
    <circle cx="450" cy="242" r="89" fill="none" stroke="#dcc995" opacity=".45" />
    {[145, 205, 265, 635, 695, 755].map(x => <g key={x}><rect x={x - 19} y="127" width="38" height="203" fill="#e3cda0" opacity=".65" /><path d={`M${x} 127V330M${x - 19} 178h38m-38 51h38m-38 51h38`} stroke="#867b58" strokeWidth="3" /></g>)}
    <path d="M0 42 450 83 900 42V0H0Z" fill="#354438" />
    {[81, 172, 263, 354, 546, 637, 728, 819].map(x => <path key={x} d={`M${x} 0 450 84`} stroke="#b59a6f" strokeWidth="6" opacity=".5" />)}
    <path d="M63 84H837M63 105H837" stroke="#5a4f3c" strokeWidth="16" />
    {[85, 302, 598, 815].map(x => <g key={x}><rect x={x - 11} y="83" width="22" height="329" fill="#66513b" /><path d={`M${x - 5} 102V394`} stroke="#b19467" strokeWidth="3" /></g>)}
    <path d="M284 371H616L644 409H256Z" fill="#7d6749" /><path d="M256 408H644V428H256Z" fill="#b09b6b" />
    <g stroke="#d6c486" strokeWidth="2">
      <path d="M450 349Q400 310 450 268Q500 310 450 349Z" fill="#e2c79c" />
      <path d="M449 350Q384 344 389 294Q435 299 449 350Z" fill="#c6a787" />
      <path d="M451 350Q516 344 511 294Q465 299 451 350Z" fill="#c6a787" />
      <path d="M450 354Q390 373 367 326Q413 318 450 354Z" fill="#af9676" />
      <path d="M450 354Q510 373 533 326Q487 318 450 354Z" fill="#af9676" />
    </g>
    <path d="M410 366H490" stroke="#e4cf9c" strokeWidth="4" />
    {[176, 355, 545, 724].map((x, i) => <g key={x} transform={`translate(${x} ${i % 2 ? 498 : 451})`}><ellipse cy="15" rx="52" ry="17" fill="#243930" opacity=".5" /><path d="M-49-8Q0-30 49-8V8Q0 29-49 8Z" fill="#a88c5d" /><ellipse cy="-8" rx="49" ry="16" fill="#c3ad7d" /><path d="M-29-10Q0-20 29-10" fill="none" stroke="#e4cf9f" opacity=".5" /></g>)}
    <path d="M0 546H900M277 428 210 600M623 428 690 600" stroke="#d2bd8a" opacity=".2" />
    {[41, 859].map(x => <g key={x}><path d={`M${x} 300V414`} stroke="#bda36f" strokeWidth="4" /><path d={`M${x - 21} 314h42l-9-48h-24Z`} fill="#e4c88f" /><ellipse cx={x} cy="416" rx="23" ry="5" fill="#a08b60" /></g>)}
  </>;
}

function Christian({ glass }: { glass: string }) {
  return <>
    <path d="M147 373V150L450 36 753 150V373Z" fill="#c3bea6" />
    <path d="M172 372V166L450 63 728 166V372Z" fill="#d9cfb2" />
    <path d="M450 64V369" stroke="#b1a585" strokeWidth="2" />
    <path d="M0 0 450 38 900 0V74L450 66 0 74Z" fill="#293e40" />
    <path d="M90 173 450 35 810 173M156 192 450 78 744 192" fill="none" stroke="#78684c" strokeWidth="16" />
    {[227, 673].map(x => <g key={x}><path d={`M${x - 43} 287V193a43 43 0 0 1 86 0v94Z`} fill={`url(#${glass})`} stroke="#857b61" strokeWidth="8" /><path d={`M${x} 151V287M${x - 42} 218h84`} stroke="#ebe2c5" strokeWidth="5" /><path d={`M${x - 36} 288 116 420H350Z`} fill="#e9e3bd" opacity=".13" /></g>)}
    <path d="M444 192h12v100h-12Z M418 218h64v11h-64Z" fill="#796044" />
    <path d="M405 352H495L520 374H380Z" fill="#9b8057" /><path d="M380 374H520V391H380Z" fill="#c0a275" />
    <path d="M450 326V355M431 328H469L463 308H437Z" stroke="#705f48" strokeWidth="5" fill="#b29870" />
    <path d="M284 391H616L682 600H218Z" fill="#b3ad91" opacity=".3" />
    <Pews color="#8b6b4d" highlight="#ba9a70" />
    <path d="M52 117V413M848 117V413" stroke="#667468" strokeWidth="24" />
    <path d="M0 426 52 413M848 413 900 426" stroke="#bdba9c" strokeWidth="7" />
    <path d="M450 391V600" stroke="#ece1bc" opacity=".15" />
    <g fill="#81937a"><path d="M94 402q-34-41-19-70q26 12 23 39q17-52 36-46q9 30-40 77Z" /><path d="M806 402q34-41 19-70q-26 12-23 39q-17-52-36-46q-9 30 40 77Z" /></g>
    <path d="M73 393H119L111 429H81ZM781 393H827L819 429H789Z" fill="#a89776" />
  </>;
}

function Pews({ color, highlight }: { color: string; highlight: string }) {
  return <>{[0, 1, 2].map(i => <g key={i}>
    <path d={`M${95 - i * 21} ${400 + i * 59}h${230 + i * 12}l24 23H${80 - i * 24}Z`} fill={color} stroke={highlight} strokeWidth="3" />
    <path d={`M${95 - i * 21} ${400 + i * 59}v-24h${230 + i * 12}v24M${92 - i * 24} ${423 + i * 59}v20M${338 - i * 9} ${423 + i * 59}v20`} fill="none" stroke={color} strokeWidth="12" />
    <path d={`M${805 + i * 21} ${400 + i * 59}H${575 + i * 9}l-24 23H${820 + i * 24}Z`} fill={color} stroke={highlight} strokeWidth="3" />
    <path d={`M${805 + i * 21} ${400 + i * 59}v-24H${575 + i * 9}v24M${808 + i * 24} ${423 + i * 59}v20M${562 + i * 9} ${423 + i * 59}v20`} fill="none" stroke={color} strokeWidth="12" />
  </g>)}</>;
}

function Catholic() {
  return <>
    <path d="M95 410V136Q450-67 805 136V410Z" fill="#74746d" />
    <path d="M167 410V167Q450-1 733 167V410Z" fill="#9a9782" />
    <path d="M325 394V199Q450 37 575 199V394Z" fill="#4e535b" stroke="#c3b38c" strokeWidth="13" />
    <path d="M351 394V211Q450 76 549 211V394" fill="none" stroke="#aaa285" strokeWidth="3" />
    {[241, 659].map(x => <g key={x}><path d={`M${x - 42} 295V181Q${x} 98 ${x + 42} 181V295Z`} fill="#516c83" stroke="#c7b78d" strokeWidth="7" /><path d={`M${x} 151v144M${x - 42} 222h84`} stroke="#d8bb85" strokeWidth="4" /><path d={`M${x} 153l-29 66 29 37 29-37Z`} fill="#ab796d" stroke="#d0b487" strokeWidth="3" /><path d={`M${x - 40} 251l39 44 41-44M${x - 39} 183l39 39 39-39`} fill="none" stroke="#ddc78c" strokeWidth="3" /><path d={`M${x - 20} 295 135 438H381Z`} fill="#c4a2a3" opacity=".09" /></g>)}
    <circle cx="450" cy="179" r="32" fill="#83948d" stroke="#cdb583" strokeWidth="5" />
    <path d="M450 149V209M420 179H480M429 157 471 201M429 201 471 157" stroke="#d4bd8e" strokeWidth="3" />
    <path d="M444 246h12v74h-12ZM425 267h50v10h-50Z" fill="#d0b279" />
    <path d="M353 351H547V367H353Z" fill="#e3d7b7" /><path d="M365 367H535V393H365Z" fill="#a89673" />
    <path d="M350 351H550V361H350Z" fill="#efe3c7" /><path d="M421 361H479V390H421Z" fill="#d1c2a0" />
    {[377, 523].map(x => <g key={x}><path d={`M${x} 347v-28`} stroke="#d3b67b" strokeWidth="4" /><rect x={x - 3} y="309" width="6" height="16" fill="#ede2c0" /></g>)}
    <path d="M308 396H592L621 416H279Z" fill="#b2a98c" /><path d="M279 416H621L650 436H250Z" fill="#8e8b7a" />
    <path d="M371 436H529L575 600H325Z" fill="#775b60" />
    <Pews color="#61554b" highlight="#a8916b" />
    {[115, 785].map(x => <g key={x}><path d={`M${x - 14} 122v291h28V122Z`} fill="#b4aa8a" /><path d={`M${x - 23} 401h46v19h-46Z M${x - 22} 122h44v17h-44Z`} fill="#cebd95" /></g>)}
    <path d="M115 132Q450-92 785 132M115 162Q450-60 785 162" fill="none" stroke="#c5b38b" strokeWidth="5" />
  </>;
}

function Islamic({ tiles }: { tiles: string }) {
  return <>
    <path d="M85 393V133H815V393Z" fill="#98a58d" />
    <path d="M116 389V158H784V389Z" fill="#c0c2a0" />
    <path d="M133 177H298V358H133Z M602 177H767V358H602Z" fill="#3e7270" />
    <path d="M133 177H298V358H133Z M602 177H767V358H602Z" fill={`url(#${tiles})`} />
    <path d="M343 390V237Q343 175 450 115Q557 175 557 237V390Z" fill="#32625e" stroke="#d9cd9e" strokeWidth="10" />
    <path d="M371 390V242Q371 199 450 149Q529 199 529 242V390Z" fill="#204845" stroke="#aeb895" strokeWidth="3" />
    <path d="M402 390V254Q402 222 450 191Q498 222 498 254V390Z" fill="#193d3a" />
    <path d="M398 278H502M403 295H497" stroke="#d6c698" strokeWidth="2" opacity=".4" />
    <path d="M68 130H832V151H68Z M68 373H332V392H68Z M568 373H832V392H568Z" fill="#d1c69f" />
    <path d="M85 102Q450-54 815 102" fill="none" stroke="#9cae96" strokeWidth="22" />
    <path d="M107 102Q450-26 793 102" fill="none" stroke="#d0cba5" strokeWidth="3" />
    {[82, 818].map(x => <g key={x}><rect x={x - 11} y="125" width="22" height="287" fill="#b0b99a" /><path d={`M${x - 18} 394h36v20h-36Z M${x - 19} 129h38v16h-38Z`} fill="#d7cdab" /></g>)}
    <path d="M126 421H774L875 580H25Z" fill="#42756a" stroke="#b6b68d" strokeWidth="3" />
    <path d="M146 433H754L833 565H67Z" fill="none" stroke="#bdbb8b" strokeWidth="2" />
    {[460, 497, 543].map(y => <path key={y} d={`M${136 - (y - 433) * .6} ${y}H${764 + (y - 433) * .6}`} stroke="#b6b58b" opacity=".6" strokeWidth="2" />)}
    {[0, 1, 2, 3, 4, 5, 6].map(i => <path key={i} d={`M${179 + i * 88} 421 ${85 + i * 121} 580`} stroke="#9eac83" opacity=".35" />)}
    <g transform="translate(217 242)" fill="none" stroke="#e0d1a2" strokeWidth="3"><path d="M0-36 11-11 36 0 11 11 0 36-11 11-36 0-11-11Z" /><path d="M-25-25H25V25H-25Z" transform="rotate(45)" /><circle r="9" /></g>
    <path d="M632 409H748V425H632Z" fill="#b6b195" /><path d="M638 402h28v7h-28ZM684 402h28v7h-28Z" fill="#d7ceae" />
  </>;
}

function Generic({ glass }: { glass: string }) {
  return <>
    <path d="M91 107H809V403H91Z" fill="#adaf9b" />
    <path d="M121 134H779V389H121Z" fill="#d5cfb5" />
    <path d="M371 389V186Q450 93 529 186V389Z" fill={`url(#${glass})`} stroke="#7d8c7d" strokeWidth="9" />
    <path d="M450 153V389M374 245H526" stroke="#d9ddc4" strokeWidth="6" />
    <path d="M380 345Q412 315 446 344Q481 298 525 345V389H380Z" fill="#789180" />
    {[216, 684].map(x => <g key={x}><path d={`M${x - 50} 176h100v151h-100Z`} fill="#8b927f" /><path d={`M${x - 42} 184h84v135h-84Z`} fill="#c2b592" /><path d={`M${x - 26} 293V231l26-27 26 27v62Z`} fill="none" stroke="#e0d4b2" strokeWidth="2" /><circle cx={x} cy="246" r="15" fill="#a19c7d" /><path d={`M${x - 31} 303h62`} stroke="#8a8a73" strokeWidth="3" /></g>)}
    <path d="M71 92H829V116H71Z" fill="#7f8879" />
    {[82, 818].map(x => <g key={x}><rect x={x - 10} y="116" width="20" height="298" fill="#89917e" /><path d={`M${x - 17} 397h34v18h-34Z`} fill="#b3b297" /></g>)}
    <path d="M295 459 450 425 605 459 450 503Z" fill="#c9b894" />
    <path d="M295 459V472L450 519V503Z" fill="#8e8267" /><path d="M605 459V472L450 519V503Z" fill="#9f9275" />
    <path d="M330 458 449 432 568 458 449 489Z" fill="#e1d2ae" />
    <path d="M362 458 440 441 440 480Z M458 441 536 458 458 480Z" fill="#b0af91" />
    <path d="M326 473V529M574 473V529" stroke="#8e8267" strokeWidth="12" />
    <path d="M139 443h115v20H139Z M646 443h115v20H646Z" fill="#a89573" />
    <path d="M154 463v36M239 463v36M661 463v36M746 463v36" stroke="#8b8167" strokeWidth="10" />
    <g fill="#607f65"><path d="M54 417Q-3 359 28 324Q57 340 54 374Q80 324 96 348Q109 379 54 417Z" /><path d="M846 417Q903 359 872 324Q843 340 846 374Q820 324 804 348Q791 379 846 417Z" /></g>
    <path d="M28 408H83L74 452H37ZM817 408H872L863 452H826Z" fill="#b2a384" />
    <path d="M0 541H900M291 405 218 600M609 405 682 600" stroke="#c8bf9e" opacity=".2" />
  </>;
}
