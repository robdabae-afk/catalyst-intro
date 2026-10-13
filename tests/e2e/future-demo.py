from playwright.sync_api import sync_playwright
import os
# Run with a local Vite server and Python Playwright installed.
base = os.environ.get('DEMO_BASE_URL', 'http://localhost:48763')
os.makedirs('/tmp/shots',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/hako/bin/google-chrome',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 errors=[]; writes=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.on('request',lambda r: writes.append(r.url) if r.method not in ['GET','HEAD'] else None)
 def shot(name):
  page.evaluate('document.fonts.ready')
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.screenshot(path='/tmp/shots/demo-'+name+'.png',full_page=False,animations='disabled')
 page.goto(base+'/demo',wait_until='networkidle')
 page.get_by_role('heading',name='Start small. Own a little of the future.').wait_for()
 shot('discover')
 page.get_by_role('button',name='Climate',exact=True).click()
 assert page.locator('.fd-startup').count()==1
 page.get_by_role('button',name='All',exact=True).click()
 page.locator('.fd-startup').first.click()
 shot('startup')
 for tab in ['Terms & risks','Q&A','Updates']:
  page.get_by_role('button',name=tab,exact=True).click()
  shot('startup-'+tab.replace(' & ','-').replace('&','').replace(' ','-').lower())
 page.get_by_role('button',name='Overview',exact=True).click()
 page.get_by_role('link',name='Invest in Morrow').click()
 shot('invest-amount')
 page.locator('#amount').fill('50')
 assert page.get_by_role('button',name='Review investment').is_disabled()
 page.locator('#amount').fill('250')
 page.get_by_role('button',name='Review investment').click()
 assert page.get_by_role('button',name='Continue to demo payment').is_disabled()
 shot('invest-review')
 page.get_by_role('checkbox').check()
 page.get_by_role('button',name='Continue to demo payment').click()
 shot('invest-payment')
 page.get_by_role('button',name='Confirm demo investment').click()
 shot('invest-success')
 page.get_by_role('button',name='View your portfolio').click()
 assert page.locator('.fd-balance').inner_text().find('$1,000')>=0
 shot('portfolio')
 page.get_by_role('link',name='Connect',exact=True).click()
 shot('connect')
 page.get_by_role('button',name='Pass',exact=True).click()
 page.get_by_role('button',name='Connect',exact=True).click()
 shot('match')
 page.get_by_role('button',name='Message founder').click()
 page.locator('#message').fill('What is your next milestone?')
 page.get_by_role('button',name='Send demo message').click()
 assert page.locator('.fd-message').count()==2
 shot('messages')
 page.get_by_role('link',name='Learn',exact=True).click()
 shot('learn')
 for term in ['Valuation cap','Dilution','Reg CF']:
  page.get_by_role('button',name=term,exact=False).click()
  assert page.locator('.fd-lesson h2').inner_text()==term
 page.reload(wait_until='networkidle')
 assert page.locator('.fd-lesson h2').inner_text()=='SAFE'
 page.goto(base+'/demo/portfolio',wait_until='networkidle')
 assert '$750' in page.locator('.fd-balance').inner_text()
 page.set_viewport_size({'width':1440,'height':1000})
 page.goto(base+'/demo',wait_until='networkidle')
 shot('desktop')
 assert not writes,writes
 assert not errors,errors
 print('PASS end-to-end demo, validation, local-only messaging, no writes, reload, mobile/desktop overflow')
 b.close()
