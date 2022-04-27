#!/bin/bash

chown -R www-data:www-data /var/www/html

/startup/runPhpFpm.sh
cat /etc/environment | /startup/setupFpmEnv.sh

python3 /startup/backend.py

tail -f /dev/null
