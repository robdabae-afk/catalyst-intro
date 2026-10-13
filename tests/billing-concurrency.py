# Disposable local fixture only, no credentials or production host accepted.
import subprocess,concurrent.futures
DB='catalyst_billing_compat'
def sql(q):
 return subprocess.run(['sudo','-u','postgres','psql','-d',DB,'-v','ON_ERROR_STOP=1','-Atc',q],capture_output=True,text=True)
u='00000000-0000-0000-0000-000000000080'
target='00000000-0000-0000-0000-000000000081'
assert sql(f"update profiles set tokens=30 where id='{u}'; delete from billing_wallets where user_id='{u}'").returncode==0
a=f"begin; set request.jwt.claim.sub='{u}'; select billing_send_instant('{target}','new','00000000-0000-0000-0000-000000000082'); select pg_sleep(0.2); commit;"
b=f"begin; select billing_legacy_instant('{u}','{target}','legacy','00000000-0000-0000-0000-000000000083'); commit;"
with concurrent.futures.ThreadPoolExecutor() as pool: results=list(pool.map(sql,[a,b]))
assert sorted(x.returncode==0 for x in results)==[False,True],[(x.returncode,x.stderr) for x in results]
assert 'NO_MESSAGE_CREDITS' in next(x.stderr for x in results if x.returncode!=0)
assert sql(f"select tokens from profiles where id='{u}'").stdout.strip()=='0'
print('Concurrent legacy/new sends consume a single shared balance once')
