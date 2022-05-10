#!/bin/bash

chown -R www-data:www-data /var/www/html

/startup/runPhpFpm.sh
cat /etc/environment | /startup/setupFpmEnv.sh

python3 /startup/backend.py 1>>/startup/backend.log 2>>/startup/backend.error.log

tail -f /dev/null
