FROM nginx

RUN apt-get update && apt-get -y install vim && rm -rf /var/cache/apt/*

COPY output/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx
