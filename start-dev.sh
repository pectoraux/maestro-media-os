#!/usr/bin/env bash
# Fully-detached dev server launcher for Maestro.
cd /home/z/my-project
pkill -f "next dev" 2>/dev/null
sleep 1
# Run next directly (bypass the tee pipeline so the process tree is simple),
# in a brand-new session with all stdio redirected. Output goes to dev.log.
setsid bash -c 'exec bun x next dev -p 3000 >> /home/z/my-project/dev.log 2>&1' < /dev/null &
echo $! > /home/z/my-project/dev.pid
disown
sleep 1
echo "launched dev, pid group leader: $(cat /home/z/my-project/dev.pid)"
