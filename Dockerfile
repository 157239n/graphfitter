FROM 157239n/php_fpm7.4
LABEL vendor=""
WORKDIR /
RUN apt-get update && apt-get install -y mysql-client php7.4-xml php7.4-mbstring \
    && curl getcomposer.org/installer | php \
    && mv /composer.phar /usr/local/bin/composer
RUN apt-get update && apt-get install -y python3-pip && pip3 install flask k1lib
COPY startup /startup
COPY .env /etc/environment
RUN mv /startup/000-default.conf /etc/apache2/sites-available/000-default.conf \
    && a2enmod rewrite && a2enmod remoteip && a2enmod proxy_http \
    && printf "\nexport PATH=$PATH:/var/www/html/vendor/bin" >> /root/.bashrc
WORKDIR /startup
CMD ["/startup/entry.sh"]
