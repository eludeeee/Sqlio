# Menggunakan Nginx versi Alpine yang ringan
FROM nginx:alpine

# Menyalin seluruh file statis ke direktori HTML Nginx
COPY . /usr/share/nginx/html

# Mengekspos port 80
EXPOSE 80

# Menjalankan Nginx
CMD ["nginx", "-g", "daemon off;"]
