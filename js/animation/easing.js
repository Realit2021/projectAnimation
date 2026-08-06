 
// ================= EASING ФУНКЦИИ =================

const EASINGS = {
    linear:        t => t,
    easeInQuad:    t => t * t,
    easeOutQuad:   t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t,
    easeInCubic:   t => t*t*t,
    easeOutCubic:  t => (--t)*t*t+1,
    easeInOutCubic:t => t<0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1
};

function buildMiniGraphSVG(easingName, color) {
    const func = EASINGS[easingName];
    let pts = [];
    for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        pts.push(`${(i/20)*100},${100 - func(t)*100}`);
    }
    return `<svg class="seg-graph" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="4" vector-effect="non-scaling-stroke"/>
    </svg>`;
}
