import {services,assertMode} from "./billing.ts";
Deno.test("mode config fails closed and never falls back to legacy key",()=>{
 const restore=["STRIPE_MODE","STRIPE_SECRET_KEY_V2","STRIPE_SECRET_KEY","SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"].map(k=>[k,Deno.env.get(k)]);
 try {
 Deno.env.set("SUPABASE_URL","https://example.supabase.co"); Deno.env.set("SUPABASE_SERVICE_ROLE_KEY","fixture");
 Deno.env.set("STRIPE_SECRET_KEY","sk_live_old_fixture");
 for(const [mode,key,valid] of [["","sk_test_fixture",false],["live","sk_test_fixture",false],["test","sk_live_fixture",false],["test","sk_test_fixture",true],["live","sk_live_fixture",true]] as const) {
  Deno.env.set("STRIPE_MODE",mode);Deno.env.set("STRIPE_SECRET_KEY_V2",key);
  let passed=true;try {services();}catch{passed=false;}
  if(passed!==valid) throw new Error("Unexpected mode acceptance");
 }
 Deno.env.delete("STRIPE_SECRET_KEY_V2");
 let rejected=false;try{services();}catch{rejected=true;}
 if(!rejected)throw new Error("Legacy fallback accepted");
 for(const live of [false,true]) {
  assertMode({livemode:live},live);
  let rejected=false;try{assertMode({livemode:!live},live);}catch{rejected=true;}
  if(!rejected)throw new Error("Mismatched event/price accepted");
 }
 }finally{for(const [k,v] of restore) {if(v===undefined)Deno.env.delete(k!);else Deno.env.set(k!,v);}}
});
