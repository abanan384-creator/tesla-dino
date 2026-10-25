(() => {
  'use strict';

  const HEIGHT = 360, GROUND = 344, PARALLAX = 0.28;
  const WIDTHS = [340, 420, 480, 680];
  const LOOP = WIDTHS.reduce((sum, width) => sum + width, 0);
  const THEMES = {
    light: {
      land:'#e8e8df', horizon:'#d8ddd3', edge:'#b4bfb6',
      tower:'#c0cbc5', towerShade:'#afbeb8', second:'#d4c8b8', secondShade:'#c2b6a6',
      window:'#94a8a4', warm:'#e8cf9d', parking:'#ccd0c5', open:'#a6b3aa',
      car:'#7e9087', rail:'#a6b2a7', station:'#c1cdbf', glass:'#a6bcb3',
      roof:'#8fa99e', train:'#e0e3d5', trainShade:'#a8b7ad', trainGlass:'#647e77', light:'#f3ce87'
    },
    dark: {
      land:'#202722', horizon:'#303b32', edge:'#3f5048',
      tower:'#34453f', towerShade:'#2c3934', second:'#494539', secondShade:'#3b382f',
      window:'#53655b', warm:'#9d8655', parking:'#39463c', open:'#232f29',
      car:'#657469', rail:'#46564b', station:'#394e43', glass:'#416455',
      roof:'#5a7766', train:'#8d9e8c', trainShade:'#536c5d', trainGlass:'#293e34', light:'#eac77d'
    }
  };
  const ease = t => t * t * (3 - 2 * t);

  function polygon(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();ctx.moveTo(...points[0]);
    for (let i=1;i<points.length;i++) ctx.lineTo(...points[i]);
    ctx.closePath();ctx.fill();
  }
  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
  }
  function windows(ctx, p, x, y, cols, rows, dx, dy, w, h, seed) {
    for (let row=0;row<rows;row++) {
      for (let col=0;col<cols;col++) {
        rect(ctx,x+col*dx,y+row*dy,w,h,(row*7+col*11+seed)%9<2?p.warm:p.window);
      }
    }
  }
  function smallCar(ctx, x, y, color, variant) {
    polygon(ctx,[[x,y],[x+3,y-7],[x+10,y-8],[x+15,y-14],
      [x+29+variant,y-14],[x+36+variant,y-7],[x+43+variant,y-5],[x+44+variant,y]],color);
    for (const wheel of [9,35+variant]) {
      ctx.beginPath();ctx.arc(x+wheel,y,3,0,Math.PI*2);ctx.fill();
    }
  }

  class CityBackground {
    constructor({trainCars=23, pixelRatio=window.devicePixelRatio||1}={}) {
      this.trainCars=Math.max(1,Math.min(30,Math.round(trainCars)));
      this.rasterScale=Math.min(Math.max(pixelRatio,1),1.5);
      this.visits=new Map();
      this.tiles={};this.trains={};
      // All paint work happens here, once for each theme. Resizing and theme
      // changes reuse these same surfaces; the frame path only blits them.
      for (const [name,palette] of Object.entries(THEMES)) {
        this.tiles[name]=WIDTHS.map((width,index)=>this.surface(width,HEIGHT,
          ctx=>this.paintBlock(ctx,palette,index,width)));
        this.trains[name]=this.surface(this.trainWidth,38,
          ctx=>this.paintTrain(ctx,palette));
      }
    }
    get trainWidth() { return this.trainCars*66-4; }
    surface(width,height,paint) {
      const w=Math.ceil(width*this.rasterScale),h=Math.ceil(height*this.rasterScale);
      const surface=typeof OffscreenCanvas==='function'
        ?new OffscreenCanvas(w,h):document.createElement('canvas');
      surface.width=w;surface.height=h;
      const context=surface.getContext('2d');
      context.scale(w/width,h/height);
      paint(context);
      return surface;
    }
    paintBlock(ctx,p,index,width) {
      // Identical edge pixels on every tile: clear sky, horizon, then pavement.
      // Architecture stays inside its tile, including both ends of the viaduct.
      rect(ctx,0,GROUND-27,width,1,p.horizon);
      rect(ctx,0,GROUND,width,HEIGHT-GROUND,p.land);
      rect(ctx,0,GROUND,width,2,p.edge);
      if (index===0) {
        rect(ctx,105,53,126,291,p.tower);
        rect(ctx,211,53,20,291,p.towerShade);
        rect(ctx,100,49,136,7,p.edge);
        rect(ctx,124,38,70,11,p.towerShade);
        windows(ctx,p,115,68,6,16,15,16,8,10,1);
        rect(ctx,150,322,24,22,p.glass);
        rect(ctx,95,339,146,5,p.edge);
      } else if (index===1) {
        rect(ctx,63,124,286,220,p.second);
        rect(ctx,327,124,22,220,p.secondShade);
        rect(ctx,57,119,298,7,p.edge);
        rect(ctx,82,105,54,14,p.secondShade);
        windows(ctx,p,78,139,12,10,21,17,11,10,4);
        for (const y of [189,240,291]) rect(ctx,63,y,264,3,p.secondShade);
        rect(ctx,167,315,59,29,p.glass);
        rect(ctx,57,339,298,5,p.edge);
      } else if (index===2) {
        rect(ctx,40,193,400,151,p.parking);
        for (let level=0;level<4;level++) {
          const y=201+level*35;
          rect(ctx,49,y,382,27,p.open);
          for (let car=0;car<5;car++) {
            smallCar(ctx,60+car*74,y+24,p.car,(car+level)%3*3);
          }
          rect(ctx,40,y+27,400,8,p.parking);
        }
        for (const x of [47,122,197,272,347,423]) rect(ctx,x,198,8,146,p.parking);
        rect(ctx,35,187,410,9,p.edge);
        rect(ctx,35,338,410,6,p.edge);
        rect(ctx,50,173,28,14,p.roof);
        ctx.fillStyle=p.land;ctx.font='bold 11px Arial';ctx.fillText('P',60,184);
      } else {
        for (const x of [62,204,346,488,630]) {
          rect(ctx,x,263,13,81,p.rail);
          rect(ctx,x-8,337,29,7,p.edge);
          polygon(ctx,[[x-8,267],[x+21,267],[x+13,278],[x,278]],p.rail);
        }
        rect(ctx,24,254,632,11,p.rail);
        rect(ctx,24,251,632,3,p.edge);
        rect(ctx,146,207,363,42,p.station);
        for (let x=156;x<500;x+=34) rect(ctx,x,211,26,34,p.glass);
        for (const x of [158,330,496]) rect(ctx,x,197,5,55,p.roof);
        polygon(ctx,[[126,198],[148,187],[500,187],[524,198]],p.roof);
        rect(ctx,126,198,398,5,p.station);
        rect(ctx,302,204,51,12,p.roof);
        ctx.fillStyle=p.land;ctx.font='9px Arial';ctx.fillText('LRT',319,213);
        // Side-on stairs connect the raised station to the shared ground line.
        for (let step=0;step<12;step++) {
          rect(ctx,520+step*8,266+step*6.5,10,3,p.rail);
        }
      }
    }
    paintTrain(ctx,p) {
      for (let car=0;car<this.trainCars;car++) {
        const x=car*66;
        if (car) rect(ctx,x-5,15,7,14,p.trainShade);
        polygon(ctx,[[x+6,5],[x+57,5],[x+62,11],[x+62,29],
          [x,29],[x,13]],p.train);
        rect(ctx,x+1,25,60,5,p.trainShade);
        ctx.shadowColor=p.light;ctx.shadowBlur=5;
        for (let pane=0;pane<4;pane++) rect(ctx,x+9+pane*11,11,8,10,p.light);
        ctx.shadowBlur=0;
        rect(ctx,x+53,10,5,14,p.trainGlass);
        if (car===0) polygon(ctx,[[x+5,9],[x+7,9],[x+7,22],[x+1,22],[x+1,14]],p.trainGlass);
        for (const wheel of [12,48]) {
          ctx.fillStyle=p.trainGlass;ctx.beginPath();
          ctx.arc(x+wheel,31,3,0,Math.PI*2);ctx.fill();
        }
      }
    }
    reset() { this.visits.clear(); }
    advance(cameraDelta) {
      // The train's cruising screen speed is 1.24 times the scenery speed.
      // Camera distance keeps animation smooth at any frame rate and paused
      // when gameplay is paused, even if the page keeps rendering.
      const travel=Math.max(0,cameraDelta)*PARALLAX*0.24;
      for (const visit of this.visits.values()) visit.travel+=travel;
    }
    trainX(visit) {
      const dock=Math.max(54,(WIDTHS[3]-this.trainWidth)/2);
      if (visit.mode==='arrival') {
        const progress=Math.min(1,visit.travel/210);
        return dock+210*(1-ease(progress));
      }
      return dock-visit.travel+42*(1-Math.exp(-visit.travel/42));
    }
    draw(ctx,{width,ground,scale,camera,dark,dpr=1,quiet=false}) {
      const unit=Math.min(1.08,Math.max(0.38,scale*0.92));
      const scroll=camera*PARALLAX,viewWidth=width/unit;
      const first=Math.floor(scroll/LOOP),last=Math.floor((scroll+viewWidth)/LOOP);
      const top=Math.round((ground-16*scale-HEIGHT*unit)*dpr)/dpr;
      const theme=dark?'dark':'light',visible=new Set();
      ctx.save();ctx.globalAlpha=quiet?0.46:0.84;
      for (let cycle=first;cycle<=last;cycle++) {
        let offset=cycle*LOOP;
        for (let index=0;index<WIDTHS.length;index++) {
          const tileWidth=WIDTHS[index];
          const left=Math.round((offset-scroll)*unit*dpr)/dpr;
          const right=Math.round((offset+tileWidth-scroll)*unit*dpr)/dpr;
          offset+=tileWidth;
          if (right<=0||left>=width) continue;
          ctx.drawImage(this.tiles[theme][index],left,top,right-left,HEIGHT*unit);
          if (index!==3) continue;
          visible.add(cycle);
          if (!this.visits.has(cycle)) {
            this.visits.set(cycle,{mode:Math.random()<0.5?'arrival':'departure',travel:0});
          }
          const visit=this.visits.get(cycle),sx=(right-left)/tileWidth;
          ctx.save();ctx.translate(left,top);ctx.scale(sx,unit);
          ctx.beginPath();ctx.rect(24,216,632,38);ctx.clip();
          ctx.drawImage(this.trains[theme],this.trainX(visit),218,this.trainWidth,38);
          ctx.restore();
        }
      }
      ctx.restore();
      // Keep only station visits currently on screen, not the entire run.
      for (const cycle of this.visits.keys()) if (!visible.has(cycle)) this.visits.delete(cycle);
    }
  }
  window.CityBackground=CityBackground;
})();
