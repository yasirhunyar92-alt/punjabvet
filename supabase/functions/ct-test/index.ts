Deno.serve((req)=>{const t=new URL(req.url).searchParams.get("ct")||"application/xml";return new Response("<?xml version=\"1.0\"?><a/>",{headers:{"Content-Type":t}});});
