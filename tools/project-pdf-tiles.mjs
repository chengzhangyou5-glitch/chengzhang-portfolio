/* Lossless, immutable PNG pyramid painter. No PDF parsing/rendering on visitors. */
export class PdfTilePainter {
  constructor(canvas, manifest, onChange) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.manifest=manifest;this.onChange=onChange;
    this.cache=new Map();this.broken=new Set();this.pending=new Set();this.queue=[];this.visible=[];this.running=0;this.failed=0;this.destroyed=false;this.retryGeneration=0;
    this.metrics={bytes:0,loaded:0,evicted:0,firstRequest:0,firstReady:0};
    this.previews=new Map();this.initialized=this.loadPreviews();
  }
  async loadPreviews(){
    await Promise.all(this.manifest.pages.map(async p=>{
      const response=await fetch(p.preview);if(!response.ok)throw Error(`Preview ${response.status}`);
      const blob=await response.blob();this.metrics.bytes+=blob.size;const image=await createImageBitmap(blob);
      if(this.destroyed)image.close();else this.previews.set(p.number,image);
    })).catch(e=>{this.failed++;console.error(e);});this.onChange();
  }
  key(page,level,col,row){return [this.manifest.sha256,this.manifest.tileVersion,level,page.number,col,row].join(':');}
  rect(page,level,col,row){
    const {tileSize:T,bleed:B}=this.manifest,r=page.rasterSizes[level];
    return {left:Math.max(0,col*T-B),top:Math.max(0,row*T-B),right:Math.min(r.width,(col+1)*T+B),bottom:Math.min(r.height,(row+1)*T+B)};
  }
  tiles(state,extra=0){
    if(!this.level)return [];
    const {scale,x,y,width,height}=state,T=this.manifest.tileSize,result=[];
    for(const p of this.manifest.pages){
      const left=x+(this.manifest.maxWidth-p.width)*scale/2,top=y+p.offset*scale;
      if(top>height+extra||top+p.height*scale<-extra)continue;
      const r=p.rasterSizes[this.level];
      const c0=Math.max(0,Math.floor((-left-extra)/scale*this.level/T)),c1=Math.min(Math.ceil(r.width/T)-1,Math.floor((width-left+extra)/scale*this.level/T));
      const r0=Math.max(0,Math.floor((-top-extra)/scale*this.level/T)),r1=Math.min(Math.ceil(r.height/T)-1,Math.floor((height-top+extra)/scale*this.level/T));
      for(let row=r0;row<=r1;row++)for(let col=c0;col<=c1;col++)result.push({page:p,level:this.level,col,row,key:this.key(p,this.level,col,row),rect:this.rect(p,this.level,col,row)});
    }return result;
  }
  draw(state){
    if(this.destroyed)return;
    this.state=state;const {scale,x,y,width,height}=state,dpr=devicePixelRatio||1;
    this.level=[...this.manifest.levels].sort((a,b)=>a-b).find(l=>l>=scale*dpr)||null;
    if(this.canvas.width!==Math.round(width*dpr)||this.canvas.height!==Math.round(height*dpr)){
      this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);
    }
    const ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0f1111';ctx.fillRect(0,0,width,height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    for(const p of this.manifest.pages){
      const left=x+(this.manifest.maxWidth-p.width)*scale/2,top=y+p.offset*scale,preview=this.previews.get(p.number);
      if(!preview||top>height||top+p.height*scale<0)continue;
      if(p.background.strategy==='source-preview-edges'){
        ctx.drawImage(preview,0,0,preview.width,1,left,Math.floor(top*dpr)/dpr,p.width*scale,2/dpr);
        ctx.drawImage(preview,0,preview.height-1,preview.width,1,left,Math.floor((top+p.height*scale)*dpr)/dpr,p.width*scale,1/dpr);
      }
      ctx.drawImage(preview,left,top,p.width*scale,p.height*scale);
    }
    this.visible=this.tiles(state);
    const T=this.manifest.tileSize;
    for(const t of this.visible){
      const tile=this.cache.get(t.key);if(!tile)continue;
      const p=t.page,left=x+(this.manifest.maxWidth-p.width)*scale/2,top=y+p.offset*scale;
      const x0=Math.max(0,t.col*T-1)/t.level,x1=Math.min(p.width*t.level,(t.col+1)*T+1)/t.level;
      const y0=Math.max(0,t.row*T-1)/t.level,y1=Math.min(p.height*t.level,(t.row+1)*T+1)/t.level;
      ctx.save();ctx.beginPath();ctx.rect(left+x0*scale,top+y0*scale,(x1-x0)*scale,(y1-y0)*scale);ctx.clip();
      ctx.drawImage(tile,left+t.rect.left/t.level*scale,top+t.rect.top/t.level*scale,tile.width/t.level*scale,tile.height/t.level*scale);ctx.restore();
    }
    const visibleKeys=new Set(this.visible.map(t=>t.key)),candidates=this.level===8?[]:this.tiles(state,Math.min(height,1000));
    candidates.sort((a,b)=>Math.abs(y+(a.page.offset+(a.row+.5)*T/a.level)*scale-height/2)-Math.abs(y+(b.page.offset+(b.row+.5)*T/b.level)*scale-height/2));
    const desired=[...this.visible,...candidates.filter(t=>!visibleKeys.has(t.key))].slice(0,Math.max(24,this.visible.length)),wanted=new Set(desired.map(t=>t.key));
    this.queue=this.queue.filter(t=>wanted.has(t.key));
    for(const t of desired){if(this.cache.has(t.key)){const image=this.cache.get(t.key);this.cache.delete(t.key);this.cache.set(t.key,image);}}
    const queued=new Set(this.queue.map(t=>t.key));
    for(const t of desired)if(!this.cache.has(t.key)&&!this.pending.has(t.key)&&!queued.has(t.key)&&!this.broken.has(t.key)){this.queue.push(t);queued.add(t.key);}
    this.queue.sort((a,b)=>Number(visibleKeys.has(b.key))-Number(visibleKeys.has(a.key)));this.evict();this.pump();
    const ready=!!this.level&&this.visible.length>0&&this.visible.every(t=>this.cache.has(t.key));
    if(ready&&!this.metrics.firstReady)this.metrics.firstReady=performance.now();
    this.canvas.dataset.ready=String(ready);this.canvas.dataset.level=String(this.level);
    return {ready,level:this.level,required:scale*dpr,failed:this.failed,failedVisible:this.visible.filter(t=>this.broken.has(t.key)).length,visible:this.visible.length,loadedVisible:this.visible.filter(t=>this.cache.has(t.key)).length,tiles:this.cache.size,dpr,...this.metrics};
  }
  evict(){
    const visible=new Set(this.visible.map(t=>t.key));
    while(this.cache.size>24){const key=[...this.cache.keys()].find(k=>!visible.has(k));if(!key)break;this.cache.get(key).close();this.cache.delete(key);this.metrics.evicted++;}
  }
  pump(){
    while(!this.destroyed&&this.running<4&&this.queue.length){
      const t=this.queue.shift(),generation=this.retryGeneration;this.running++;this.pending.add(t.key);if(!this.metrics.firstRequest)this.metrics.firstRequest=performance.now();
      (async()=>{
        const url=this.manifest.tileUrlTemplate.replace('{level}',t.level).replace('{page}',t.page.number).replace('{col}',t.col).replace('{row}',t.row);
        const response=await fetch(url);if(!response.ok)throw Error(`Static PNG ${response.status}: ${url}`);
        const blob=await response.blob();this.metrics.bytes+=blob.size;const image=await createImageBitmap(blob);
        if(this.destroyed){image.close();return;}this.cache.set(t.key,image);this.metrics.loaded++;this.evict();
      })().catch(e=>{if(generation===this.retryGeneration){this.failed++;this.broken.add(t.key);console.error(e);}}).finally(()=>{this.pending.delete(t.key);this.running--;this.onChange();this.pump();});
    }
  }
  retry(){if(this.destroyed)return;this.retryGeneration++;this.broken.clear();this.failed=0;this.onChange();}
  destroy(){this.destroyed=true;this.queue=[];for(const image of this.cache.values())image.close();for(const image of this.previews.values())image.close();this.cache.clear();this.previews.clear();}
}
