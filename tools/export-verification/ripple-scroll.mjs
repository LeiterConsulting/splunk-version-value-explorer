import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
export async function verifyRippleScroll(browser,output,base='http://127.0.0.1:4173'){
  fs.mkdirSync(output,{recursive:true});const result={outcome:'passed',cases:[]};
  for(const theme of ['default','cisco'])for(const [width,height] of [[1220,900],[1440,560],[768,900],[390,844]]){
    const id=theme+'-'+width+'x'+height,context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();
    if(base.includes('127.0.0.1'))await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    const panel=page.locator('.evidence-panel');
    const state=()=>panel.evaluate(el=>({panel:el.scrollTop,page:window.scrollY,client:el.clientHeight,scroll:el.scrollHeight,top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,viewport:innerHeight,overflow:getComputedStyle(el).overflowY,overscroll:getComputedStyle(el).overscrollBehaviorY,focused:el===document.activeElement}));
    async function pan(x,y,dy){const session=await context.newCDPSession(page);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+dy*i/8}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();}
    try{
      await page.goto(base+'/ripple?assessment=http2-iosxe'+(theme==='cisco'?'&theme=cisco':''));await panel.waitFor();
      // Place the evidence region below the actual sticky chrome, well before the ledger ends.
      await panel.evaluate(el=>{const edge=parseFloat(getComputedStyle(el).top)||document.querySelector('.ripple-tools').getBoundingClientRect().bottom+16;window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-edge);});
      let start=await state();
      if(width>=1100){
        assert(start.scroll>start.client+100,'Desktop evidence needs an independent scroll range');assert(start.bottom<=height-10,'Evidence exceeds viewport: '+JSON.stringify(start));
        const box=await panel.boundingBox();await page.mouse.move(box.x+box.width/2,Math.min(height-70,box.y+160));await page.mouse.wheel(0,320);await page.waitForFunction(()=>document.querySelector('.evidence-panel').scrollTop>100);
        await page.waitForTimeout(180);let after=await state();assert(Math.abs(after.page-start.page)<2,'Wheel escaped into the main page: '+JSON.stringify({start,after}));
        await panel.focus();await page.keyboard.press('End');await page.waitForFunction(()=>{const e=document.querySelector('.evidence-panel');return e.scrollTop>=e.scrollHeight-e.clientHeight-2;});
        const edge=await state();await page.mouse.wheel(0,400);await page.waitForTimeout(150);const afterEdge=await state();assert(Math.abs(afterEdge.page-edge.page)<2,'Bottom boundary chained into page: '+JSON.stringify({start,edge,afterEdge}));
        assert(await panel.getByRole('link',{name:'Upstream CVE record'}).isVisible());
        await page.keyboard.press('Home');await page.waitForFunction(()=>document.querySelector('.evidence-panel').scrollTop<2);const upper=await state();await page.mouse.wheel(0,-400);await page.waitForTimeout(150);assert(Math.abs((await state()).page-upper.page)<2,'Top boundary chained into page');await page.keyboard.press('PageDown');await page.waitForFunction(()=>document.querySelector('.evidence-panel').scrollTop>50);assert(Math.abs((await state()).page-start.page)<2,'Keyboard scrolled the page');
        await page.keyboard.press('Home');const input=panel.getByRole('textbox',{name:'Installed product version'});await input.fill('17.15.1');const inputPosition=(await state()).panel;await input.press('ArrowLeft');assert.equal(await input.evaluate(el=>el.selectionStart),6);assert.equal((await state()).panel,inputPosition,'Nested form keys moved the evidence panel');
        // Returning to another assessment restores the evidence heading without jumping the ledger.
        await page.getByRole('button',{name:'Inspect CVE-2023-44487 for Cisco Secure Firewall FTD',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.evidence-panel').scrollTop<2);assert.equal(new URL(page.url()).searchParams.get('assessment'),'http2-ftd');
        const beforePage=await state();await page.mouse.move(150,Math.min(height-50,300));await page.mouse.wheel(0,300);await page.waitForFunction(y=>window.scrollY>y+100,beforePage.page);
        assert.equal(await panel.evaluate(el=>el.scrollTop),0,'Page wheel unexpectedly scrolled evidence');
        await page.locator('.watch-button').first().click();assert.equal(await page.locator('.watch-button').first().getAttribute('aria-pressed'),'true');
        // Exercise touch last so Chromium's touch inertia cannot latch the following mouse wheel.
        await panel.evaluate(el=>{el.scrollTop=0;window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-parseFloat(getComputedStyle(el).top));});const touchStart=await state(),touchBox=await panel.boundingBox();await pan(touchBox.x+touchBox.width/2,Math.min(height-55,touchBox.y+touchBox.height-40),-190);await page.waitForFunction(()=>document.querySelector('.evidence-panel').scrollTop>20);assert(Math.abs((await state()).page-touchStart.page)<2,'Touch escaped into page');
      }else{
        assert.equal(start.overflow,'visible','Single-column evidence must use page scrolling');assert.equal(start.panel,0);assert(Math.abs(start.scroll-start.client)<3,'Mobile evidence has a nested scroll range');
        await panel.focus();const before=await state();await page.keyboard.press('PageDown');await page.waitForFunction(y=>window.scrollY>y+20,before.page);assert.equal((await state()).panel,0);
        await panel.evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-180));const touchStart=await state();await pan(width/2,Math.min(height-80,500),-180);await page.waitForFunction(y=>window.scrollY>y+20,touchStart.page);assert.equal((await state()).panel,0);
      }
      const interactionFinal=await state();await page.screenshot({path:path.join(output,id+'.png')});
      await page.emulateMedia({media:'print'});const print=await panel.evaluate(el=>({max:getComputedStyle(el).maxHeight,overflow:getComputedStyle(el).overflowY}));assert.equal(print.max,'none');assert.equal(print.overflow,'visible');await page.emulateMedia({media:'screen'});
      result.cases.push({id,passed:true,desktop:width>=1100,final:interactionFinal,printUnconstrained:true});
    }catch(e){await page.screenshot({path:path.join(output,id+'-failure.png'),fullPage:true});throw Error(id+': '+e.stack);}finally{await context.close();}
  }
  fs.writeFileSync(path.join(output,'ripple-scroll.json'),JSON.stringify(result,null,2)+'\n');return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const browser=await chromium.launch();try{console.log(JSON.stringify(await verifyRippleScroll(browser,path.resolve(process.argv[3]||'ripple-scroll-artifacts'),process.argv[2])));}finally{await browser.close();}}
