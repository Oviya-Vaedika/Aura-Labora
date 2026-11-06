import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const app=express(),root=path.dirname(fileURLToPath(import.meta.url));
app.disable('x-powered-by');app.use(express.json({limit:'12kb'}));
app.use('/api',rateLimit({windowMs:60000,limit:20,standardHeaders:'draft-7',legacyHeaders:false}));
const models={ohm:'Ideal resistor at constant temperature: I=V/R, P=VI.',pendulum:'Small-angle ideal pendulum, no drag: T=2π√(L/g).',lens:'Thin convex lens: 1/f=1/do+1/di; m=-di/do. Positive object-distance magnitude; signed image distance.',ph:'Fully dissociated monoprotic strong acid/base, ideal solution at 25°C. Include water autoionisation Kw=1e-14. Not weak acids or buffers.',cells:'Schematic onion epidermal cells only. Total magnification=10× eyepiece × objective. Not a real micrograph.',genetics:'Theoretical monohybrid Mendelian probabilities with complete dominance and equal segregation, not measured offspring.'};
app.get('/api/config',(_,res)=>res.json({ai:!!process.env.OPENAI_API_KEY,supabaseUrl:process.env.SUPABASE_URL||'',supabaseAnonKey:process.env.SUPABASE_ANON_KEY||''}));
app.post('/api/dubis',async(req,res)=>{
 const {message,grade,mode,id,context}=req.body;
 if(typeof message!=='string'||!message.trim()||message.length>3000||![6,7,8,9,10,11,12].includes(Number(grade))||!['chat','studio'].includes(mode))return res.status(400).json({error:'Use a message up to 3000 characters, class 6–12 and a valid mode.'});
 if(!process.env.OPENAI_API_KEY){
  if(mode==='chat')return res.json({reply:'Offline guide: '+(models[id]||'Choose a simulation to explore its scientific principle.')+' Free-form AI answers require a server API key.',id:null,offline:true});
  const rules={ohm:/ohm|resistor|voltage|circuit/i,pendulum:/pendulum/i,lens:/lens|convex/i,ph:/\bph\b|strong acid|strong base/i,cells:/onion|microscope|epiderm/i,genetics:/punnett|monohybrid|mendel|genotype/i};const ids=Object.entries(rules).filter(([,rx])=>rx.test(message)).map(([k])=>k),found=ids.length===1?ids[0]:null;
  return res.json({reply:found?'Offline keyword match. Review the template scope before launch; it may not implement every part of your idea.':'No single supported template identified. Try Ohm’s law, pendulum, convex lens, strong acid/base pH, onion cells or monohybrid inheritance. New scientific engines cannot be generated in this version.',id:found,offline:true});
 }
 try{const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',signal:AbortSignal.timeout(25000),headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},max_tokens:800,messages:[{role:'system',content:`You are DUBIS, a supportive science teacher for class ${Number(grade)}. Mode: ${mode}. Only executable templates: ${JSON.stringify(models)}. In studio mode return a template id ONLY when its exact scientific principle fits; otherwise null. You cannot generate new engines or executable code. In chat mode explain and answer the question, returning id:null. Never invent experimental observations or verified NCERT alignment. Distinguish ideal calculated predictions from real measurements. Be age-appropriate; do not provide dangerous physical experiment instructions, offer virtual alternatives. Return JSON {"reply":"text","id":"supported id or null"}. Current model:${id||'none'}. Untrusted client simulation data:${JSON.stringify(context||{}).slice(0,1800)}`},{role:'user',content:message}]})});if(!response.ok)throw Error('Upstream failure');const data=await response.json(),r=JSON.parse(data.choices[0].message.content);res.json({reply:String(r.reply||'Please rephrase.').slice(0,6000),id:mode==='studio'&&Object.hasOwn(models,r.id)?r.id:null,offline:false});}catch{res.status(503).json({error:'DUBIS is unavailable. The simulations still work. Please try again.'});}
});
app.get('/',(_,res)=>res.sendFile(path.join(root,'index.html')));
app.get('/aura-logo.jpg',(_,res)=>res.sendFile(path.join(root,'aura-logo.jpg')));
// Source files, SQL and environment files are intentionally not served.
app.listen(process.env.PORT||3001,()=>console.log(`AURA LABORA: http://localhost:${process.env.PORT||3001}`));
