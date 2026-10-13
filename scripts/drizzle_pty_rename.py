import pty,os,sys,time,select
pid,fd=pty.fork()
if pid==0: os.execvp("npx",["npx","drizzle-kit","generate","--name",sys.argv[1]])
out=b"";sent=False;t=time.time()
while time.time()-t<60:
  r,_,_=select.select([fd],[],[],0.5)
  if r:
    try: d=os.read(fd,4096)
    except OSError: break
    if not d: break
    out+=d
  if not sent and b"rename" in out: time.sleep(0.5); os.write(fd,b"\x1b[B"); time.sleep(0.3); os.write(fd,b"\r"); sent=True
sys.stdout.write(out.decode(errors="replace"))
