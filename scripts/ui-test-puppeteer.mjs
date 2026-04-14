import puppeteer from 'puppeteer';
(async ()=>{
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG>', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR>', err.toString()));
  try {
    await page.goto('http://localhost:3010/parking/admin', { waitUntil: 'networkidle2' });
    await new Promise(r=>setTimeout(r,1500));
    await page.evaluate(()=>{
      const psel = document.getElementById('admin-parking-select');
      if(psel && psel.options.length>1) { psel.selectedIndex = 1; psel.dispatchEvent(new Event('change',{bubbles:true})); }
      const csel = document.getElementById('admin-caja-select');
      if(csel && csel.options.length>1) { csel.selectedIndex = 1; csel.dispatchEvent(new Event('change',{bubbles:true})); }
    });
    await new Promise(r=>setTimeout(r,500));
    const clicked = await page.evaluate(()=>{
      const btn = Array.from(document.querySelectorAll('button')).find(b=>b.textContent && b.textContent.trim().includes('Abrir caja administrativa'));
      if(btn){ btn.click(); return true; }
      return false;
    });
    console.log('clicked?', clicked);
    await new Promise(r=>setTimeout(r,1500));
  } catch(e){
    console.log('SCRIPT ERROR', e);
  } finally{
    await browser.close();
    console.log('SCRIPT DONE');
  }
})();