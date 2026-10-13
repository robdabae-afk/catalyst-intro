from playwright.sync_api import sync_playwright
import os
# Local Vite server plus Python Playwright required.
base = os.environ.get('DEMO_BASE_URL', 'http://localhost:48763')
os.makedirs('/tmp/shots', exist_ok=True)
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
 page.get_by_role('heading',name='Pick a startup. Send the check.').wait_for()
 assert page.locator('.fd-nav a').count()==2
 assert page.locator('.fd-startup').count()==3
 shot('discover')
 page.locator('.fd-startup').first.click()
 shot('startup')
 assert page.locator('details').count()==10
 for label,name in [('Company & business','company'),('Team, officers & ownership','team'),('Offering terms & deadline','terms'),('Use of proceeds','proceeds'),('Financials & financial condition','financials'),('Risks','risks'),('Capital structure & prior financing','capital'),('Intermediary, reporting & other disclosures','reporting'),('Most asked by investors','faq')]:
  page.locator('summary',has_text=label).click() if label!='Company & business' else None
  page.locator('summary',has_text=label).evaluate('(el) => el.scrollIntoView({block: \"start\"})')
  page.evaluate('window.scrollBy(0,-64)')
  shot('disclosure-'+name)
 assert page.locator('table tbody tr').count()==9
 page.locator('summary',has_text='One follow-up question').click()
 page.locator('#followup').fill('What is included in offering costs?')
 page.get_by_role('button',name='Submit for founder approval').click()
 assert page.get_by_role('status').inner_text()=='Awaiting founder approval. Not delivered.'
 assert page.locator('#followup').count()==0
 page.locator('summary',has_text='One follow-up question').evaluate('(el)=>el.scrollIntoView({block:"start"})')
 page.evaluate('window.scrollBy(0,-64)')
 shot('followup-pending')
 page.locator('summary',has_text='Preview founder review').click()
 page.get_by_role('button',name='Simulate founder approval').click()
 assert page.get_by_role('status').inner_text()=='Founder approved. Demo question delivered.'
 shot('followup-approved')
 page.get_by_role('link',name='All startups',exact=True).click()
 page.locator('.fd-startup').first.click()
 page.locator('summary',has_text='One follow-up question').click()
 assert page.locator('#followup').count()==0
 assert page.get_by_role('status').inner_text()=='Founder approved. Demo question delivered.'
 
 page.get_by_role('link',name='Invest from $100',exact=True).click()
 shot('invest-amount')
 for invalid in ['50','100.5','10001','']:
  page.locator('#amount').fill(invalid)
  assert page.get_by_role('button',name='Review investment').is_disabled()
 page.locator('#amount').fill('250')
 page.get_by_role('button',name='Review investment').click()
 assert page.get_by_role('button',name='Continue to demo payment').is_disabled()
 shot('invest-review')
 page.get_by_role('checkbox').check()
 page.get_by_role('button',name='Continue to demo payment').click()
 page.get_by_role('radio').nth(1).check()
 shot('invest-payment')
 page.get_by_role('button',name='Send demo check').click()
 shot('invest-success')
 page.get_by_role('button',name='View your portfolio').click()
 assert '$1,000' in page.locator('.fd-balance').inner_text()
 assert page.locator('.fd-holding').count()==3
 shot('portfolio')
 page.reload(wait_until='networkidle')
 assert '$750' in page.locator('.fd-balance').inner_text()
 page.goto(base+'/demo/people',wait_until='networkidle')
 assert page.get_by_role('heading',name="That page isn't here.").is_visible()
 page.goto(base+'/demo/startup/common',wait_until='networkidle')
 assert page.get_by_role('heading',name='Common Ground',exact=True).is_visible()
 page.locator('summary',has_text='One follow-up question').click()
 page.locator('#followup').fill('How are excess proceeds allocated?')
 page.get_by_role('button',name='Submit for founder approval').click()
 page.locator('summary',has_text='Preview founder review').click()
 page.get_by_role('button',name='Simulate founder decline').click()
 assert page.get_by_role('status').inner_text()=='Founder declined. Question not delivered.'
 assert page.locator('#followup').count()==0
 assert page.get_by_role('button',name='Simulate founder approval').count()==0
 page.set_viewport_size({'width':1440,'height':1000})
 page.goto(base+'/demo',wait_until='networkidle')
 shot('desktop')
 page.goto(base+'/demo/startup/morrow',wait_until='networkidle')
 shot('startup-desktop')
 assert not writes,writes
 assert not errors,errors
 print('PASS single gated follow-up and minimal loop, full disclosures, amount/risk validation, local-only portfolio, no chat/routes/writes, mobile/desktop')
 b.close()
